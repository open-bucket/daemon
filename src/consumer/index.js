/**
 * Lib imports
 */
const uuid = require('uuid/v4');
const BPromise = require('bluebird');
const { createReadStream, stat } = require('fs');
const { basename, join } = require('path');
const { createGzip } = require('zlib');
const bytes = require('bytes');

/**
 * Project imports
 */
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const ContractService = require('@open-bucket/contracts');
const { splitToDiskP } = require('../core/file');
const { createCipher } = require('../core/crypto');
const { seed } = require('../core/torrent');

const statP = BPromise.promisify(stat);

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

function getAllConsumersP() {
    return api.get({url: '/consumers', token: CM.configs.authToken});
}

function getConsumerP(id) {
    return api.get({url: `/consumers/${id}`, token: CM.configs.authToken});
}

function getConsumerFileP(consumerId) {
    return api.get({url: `/consumers/${consumerId}/files`, token: CM.configs.authToken});
}

async function createConsumerP({tier, name}) {
    function printNewConsumerInfo({key, space, config}) {
        console.log('Generated a new consumer key:', key);
        console.log('Created new consumer space at:', space);
        console.log('Created new consumer config at:', config);
    }

    const consumerInfo = await api.post({url: '/consumers', body: {tier, name}, token: CM.configs.authToken});

    const key = uuid();
    const space = await SM.makeConsumerSpace(consumerInfo.id);
    const config = await CM.writeConsumerConfigFileP(consumerInfo.id, {id: consumerInfo.id, key, space});

    printNewConsumerInfo({key, space, config});

    return consumerInfo;
}

function createConsumerActivationP({consumerId, accountIndex, value}) {
    return ContractService.createConsumerActivationP({consumerId, accountIndex, value});
}

async function updateConsumerP(consumer) {
    return await api.put({url: `/consumers/${consumer.id}`, body: consumer, token: CM.configs.authToken});
}

async function _prepareFileP({ filePath, key, space }) {
    if (!key) {
        throw new Error('Consumer key is not found');
    }

    const [inputFileStat, outputDirStat] = await BPromise.all([statP(filePath), statP(space)]);

    if (!inputFileStat.isFile()) {
        throw new Error('Target is not a file');
    }

    if (!outputDirStat.isDirectory()) {
        throw new Error('Given consumer space is not a directory');
    }

    if (!inputFileStat.size) {
        throw new Error('File is empty');
    }

    const PART_SIZE = bytes.parse('1GB');
    const filePathInConsumerSpace = join(space, basename(filePath));
    const encryptedFileStream = createReadStream(filePath)
        .pipe(createCipher(key))
        .pipe(createGzip());
    return splitToDiskP(encryptedFileStream, PART_SIZE, filePathInConsumerSpace);
}

async function uploadFile({ name, filePath, consumerId }) {
    console.log('Start uploading process...');
    console.log('> Please don\'t open/modify the file in during the process');

    const shards = await CM.readConsumerConfigFileP(consumerId)
        .then(({ key, space }) => _prepareFileP({ filePath, key, space }));
    const streams = shards.map(shard => createReadStream(shard));
    const magnetUris = await Promise.all(streams.map(stream => seed(stream)));

    const file = await api.post({ url: '/files', body: { magnetUris, name, consumerId }, token: CM.configs.authToken });
    return file;
}

module.exports = {
    createConsumerP,
    getAllConsumersP,
    getConsumerP,
    getConsumerFileP,
    updateConsumerP,
    uploadFile,
    createConsumerActivationP
};
