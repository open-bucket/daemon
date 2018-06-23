/**
 * Lib imports
 */
const uuid = require('uuid/v4');
const BPromise = require('bluebird');
const {createReadStream, stat} = require('fs');
const {basename, join} = require('path');
const {createGzip} = require('zlib');
const {pick} = require('ramda');

/**
 * Project imports
 */
const {promptHeaderP} = require('../core/prompt');
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const {splitToDiskP} = require('../core/file');
const {createCipher} = require('../core/crypto');

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

const statP = BPromise.promisify(stat);

function getConsumersP() {
    return api.get({url: '/consumers', token: CM.configs.authToken});
}

async function createConsumerP({address}) {
    const newConsumerInfo = await api.post({url: '/consumers', body: {address}, token: CM.configs.authToken});
    const {id} = newConsumerInfo;
    const key = uuid();
    console.log('Generated a new consumer key:', key);
    console.log('OBN Daemon will use this consumer key to encrypt/decrypt your data, please save this key in a secure place');

    const space = await SM.makeConsumerSpace(id);
    console.log('Created new consumer space at:', space);

    const consumerConfigFilePath = await CM.writeConsumerConfigFileP(id, {id, key, space});
    console.log('Created new consumer config at:', consumerConfigFilePath);

    return newConsumerInfo;
}

// default parts count = 5
// minSize = 10MB

// If file is larger than 1GB -> shard. Not always shard
// maxFileSize = 1GB - Producer will have their min sizeLimit is 1GB
// If file = 10GB => 10 parts

// shard is not needed to increase security & performance
// since if file is < 1GB, it is not sharded => 1 torrent file => every producer serving that torrent will serve parts of that file
// => torrent increase the performance for us


// Using key
// encrypt the file: const encryptedReadStream = fs.createReadStream(filePath).pipe(encrypt)
// [later] shard the file: DEFAULT: 5 parts, min size: 10 MB
//  - decide size of the shard.
//  - uses: https://github.com/dannycho7/split-file-stream
//  - to consumer space
// for each shard ->


async function _prepareFileP({filePath, key, space}) {
    if (!key) {
        return BPromise.reject(new Error('Consumer key is not found'));
    }

    const [inputFileStat, outputDirStat] = await BPromise.all([statP(filePath), statP(space)]);

    if (!inputFileStat.isFile()) {
        return BPromise.reject(new Error('The given file is not valid'));
    }

    if (!outputDirStat.isDirectory()) {
        return BPromise.reject(new Error('Given consumer space is not a directory'));
    }

    if (!inputFileStat.size) {
        return BPromise.reject(new Error('File is empty'));
    }

    const GB_SIZE = Math.pow(1024, 3);
    // consumerSpace = ~/.open-bucket/spaces/consumer-1
    // filePath = ~/somewhere/asd.pdf
    const rootFileName = join(space, basename(filePath));
    const encryptedFileStream = createReadStream(filePath)
        .pipe(createCipher(key))
        .pipe(createGzip());
    await splitToDiskP(encryptedFileStream, GB_SIZE, rootFileName);
}


// TODO: allow user to add consumer config
function uploadFile({filePath, consumerId}) {
    console.log('Start uploading process...');
    console.log('> Please don\'t open/modify the file in during the process');

    // CASES:
    // - read consumer config file failed
    // - make sure consumer space is present
    // - filePath is invalid
    return CM.readConsumerConfigFileP(consumerId)
        .then(({key, space}) => _prepareFileP({filePath, key, space}));
}

async function uploadFilePromptP() {
    const header = '---------Upload a file to Open Bucket Network---------';

    console.log('Loading your consumer list...');
    const consumers = await getConsumersP();

    const questions = [
        {
            type: 'input',
            name: 'filePath',
            message: 'Input path to the file'
        },
        {
            type: 'list',
            name: 'consumerInfo',
            message: 'Please choose the consumer to use',
            choices: consumers.map(pick(['id', 'address'])).map(JSON.stringify)
        },
        {
            type: 'input',
            name: 'filePath',
            message: 'Input path to consumer config file',
            default: 'OBN_SPACES_PATH/consumer-${id}' // must know the consumer id user choose heres
        }
    ];

    return promptHeaderP(header, questions)
        .then(uploadFile);
    // get consumer list from Tracker
    // ask user what consumer they want to use -> consumerId
    // read chosen consumer config
    // if OK: call uploadFile
    // if NOT [not likely to happen]: let user input path to their consumer config file or request they delete it.

}

function createConsumerPromptP() {
    const header = '---------Create new consumer---------';

    const questions = [
        {
            type: 'input',
            name: 'address',
            message: 'Input your Ethereum address'
        }
    ];

    return promptHeaderP(header, questions).then(createConsumerP);
}

module.exports = {
    createConsumerPromptP,
    createConsumerP,
    getConsumersP,
    uploadFilePromptP
};
