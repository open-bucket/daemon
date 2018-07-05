/**
 * Lib imports
 */
const uuid = require('uuid/v4');
const BPromise = require('bluebird');
const {createReadStream, stat} = require('fs');
const {basename, join} = require('path');
const {createGzip} = require('zlib');
const bytes = require('bytes');
const {prop} = require('ramda');

/**
 * Project imports
 */
const CM = require('./config-manager');
const SM = require('./space-manager');
const api = require('./core/api');
const {splitToDiskP} = require('./core/file');
const {createCipher} = require('./core/crypto');
const {createDebugLogger} = require('./utils');
const WebTorrentClient = require('./webtorrent-client');
const ContractService = require('@open-bucket/contracts');
const {connectConsumerP} = require('./core/ws');
const {WS_ACTIONS} = require('./enums');

const statP = BPromise.promisify(stat);

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('consumer');

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

function updateConsumerP(consumer) {
    return api.put({url: `/consumers/${consumer.id}`, body: consumer, token: CM.configs.authToken});
}

function _prepareFileP({filePath, key, space}) {
    const PART_SIZE = bytes.parse(CM.configs.partSize);
    const filePathInConsumerSpace = join(space, basename(filePath));
    const encryptedFileStream = createReadStream(filePath)
        .pipe(createCipher(key))
        .pipe(createGzip());
    return splitToDiskP(encryptedFileStream, PART_SIZE, filePathInConsumerSpace);
}

async function uploadP({filePath, consumerId}) {
    async function handleNewProducerAccepted({fileId, shardId, producerId, currentAv}) {
        log(`Producer ${producerId} is now serving shard ${shardId} your file`, null);
        log(`File ${fileId} current availability: `, currentAv, null);
    }

    async function handleUploadFileDone({fileId, shards}) {
        console.log(`File ${fileId} current availability has reached 1, done`);
        console.log('> Your file has been uploaded to the first producers');
        console.log('> It is now being uploaded by the producers themselves to increase the availability');

        console.log('Cleaning up resources..');
        await BPromise.all(shards.map(s => SM.removeConsumerFileP(consumerId, s.name)));
        console.log('Deleted temporary shards in Consumer space');

        wsClient.close();
    }

    function handleMessage(rawMessage) {
        log('Received new message from Tracker', rawMessage);
        const {action, payload} = JSON.parse(rawMessage);
        if (action === WS_ACTIONS.CONSUMER_NEW_PRODUCER_ACCEPTED) {
            handleNewProducerAccepted(payload)
                .then(() => log('Handled CONSUMER_NEW_PRODUCER_ACCEPTED', payload))
                .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }

        if (action === WS_ACTIONS.CONSUMER_UPLOAD_FILE_DONE) {
            handleUploadFileDone(payload)
                .then(() => log('Handled CONSUMER_NEW_PRODUCER_ACCEPTED', payload))
                .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }
    }

    function handleClose(code) {
        console.log('Connection with Tracker has been closed with code', code);
        WebTorrentClient.destroyP();
    }

    function handleError(error) {
        console.log('wsClient error with error', error);
    }

    console.log('Preparing...');
    console.log('> Do NOT open/modify the file');
    const {key, space} = await CM.readConsumerConfigFileP(consumerId);
    const shardPaths = await _prepareFileP({filePath, key, space});
    const shardsInfo = await BPromise.all(shardPaths.map(path =>
        BPromise.all([
            statP(path).then(prop('size')),
            SM.fileToHashP(path),
            WebTorrentClient.seedP({
                stream: createReadStream(path),
                name: basename(path)
            }).then(prop('magnetURI'))]
        )));

    const wsClient = await connectConsumerP(consumerId);
    wsClient.on('message', handleMessage)
        .on('close', handleClose)
        .on('error', handleError);

    const message = {
        action: WS_ACTIONS.CONSUMER_UPLOAD_FILE,
        payload: {
            consumerId,
            name: basename(filePath),
            hash: await SM.fileToHashP(filePath),
            size: await statP(filePath).then(prop('size')),
            shards: shardsInfo.map(([size, hash, magnetURI], index) => ({
                name: basename(shardPaths[index]),
                magnetURI,
                hash,
                size,
            }))
        }
    };

    console.log('Uploading...');
    console.log('> Do NOT modify the consumer space');
    wsClient.send(JSON.stringify(message));
}

module.exports = {
    createConsumerP,
    getAllConsumersP,
    getConsumerP,
    getConsumerFileP,
    updateConsumerP,
    uploadP,
    createConsumerActivationP
};
