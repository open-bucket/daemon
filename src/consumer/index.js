/**
 * Lib imports
 */
const uuid = require('uuid/v4');
const BPromise = require('bluebird');
const { createReadStream, stat } = require('fs');
const { basename, join } = require('path');
const { createGzip } = require('zlib');
const { seed } = require('../core/torrent');
/**
 * Project imports
 */
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const ContractService = require('@open-bucket/contracts');
const { splitToDiskP } = require('../core/file');
const { createCipher } = require('../core/crypto');

const statP = BPromise.promisify(stat);

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

function getConsumersP() {
    return api.get({ url: '/consumers', token: CM.configs.authToken });
}

async function createConsumerP({ tier, name }) {
    function printNewConsumerInfo({ key, space, config }) {
        console.log('Generated a new consumer key:', key);
        console.log('Created new consumer space at:', space);
        console.log('Created new consumer config at:', config);
    }

    const consumerInfo = await api.post({ url: '/consumers', body: { tier, name }, token: CM.configs.authToken });

    const key = uuid();
    const space = await SM.makeConsumerSpace(consumerInfo.id);
    const config = await CM.writeConsumerConfigFileP(consumerInfo.id, { id: consumerInfo.id, key, space });

    printNewConsumerInfo({ key, space, config });

    return consumerInfo;
}

function createConsumerActivationP({ consumerId, accountIndex, value }) {
    return ContractService.createConsumerActivationP({ consumerId, accountIndex, value });
}

async function updateConsumerP(consumer) {
    const newConsumerInfo = await api.put({ url: `/consumers/${consumer.id}`, body: consumer, token: CM.configs.authToken });
    console.log('Updated consumer: ', newConsumerInfo);
    return newConsumerInfo;

}

async function _prepareFileP({ filePath, key, space }) {
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
    return await splitToDiskP(encryptedFileStream, GB_SIZE, rootFileName);
}

async function uploadFile({ name, filePath, consumerId }) {
    console.log('Start uploading process...');
    console.log('> Please don\'t open/modify the file in during the process');

    // CASES:
    // - read consumer config file failed
    // - make sure consumer space is present
    // - filePath is invalid
    const shards = await CM.readConsumerConfigFileP(consumerId)
        .then(({ key, space }) => _prepareFileP({ filePath, key, space }));
    const streams = shards.map(shard => createReadStream(shard));
    const magnetUris = await Promise.all(streams.map(stream => seed(stream)));
    const file = await api.post({ url: '/files', body: { magnetUris, name, consumerId }, token: CM.configs.authToken });
    return file;
}

module.exports = {
    createConsumerP,
    getConsumersP,
    createConsumerActivationP,
    updateConsumerP,
    uploadFile
};
