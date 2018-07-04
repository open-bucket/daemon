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
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const {splitToDiskP} = require('../core/file');
const {createCipher} = require('../core/crypto');
const {createDebugLogger} = require('../utils');
const WebTorrentClient = require('../webtorrent-client');
const ContractService = require('@open-bucket/contracts');
const {connectConsumerP} = require('../core/ws');
const {WS_ACTIONS} = require('../enums');

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
    function handleMessage(rawMessage) {
        const {action, payload} = JSON.parse(rawMessage);
        switch (action) {
            // TODO: this is just the demo action. Change this when we do actual implementation
            case WS_ACTIONS.CONSUMER_FILE_AVAILABILITY_UPDATED:
                console.log('CONSUMER_FILE_AVAILABILITY_UPDATED received', payload);
        }
        console.log('on wsClient message', {action, payload});
    }

    function handleClose(code) {
        console.log('wsClient closed with code', code);
    }

    function handleError(error) {
        console.log('wsClient error with error', error);
    }

    const wsClient = await connectConsumerP(consumerId);
    wsClient.on('message', handleMessage)
        .on('close', handleClose)
        .on('error', handleError);

    console.log('Preparing file...');
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

    console.log('Uploading file...');
    console.log('> Do NOT modify the consumer space');
    wsClient.send(JSON.stringify(message));
    // TODO: remember to destroy the webtorrent client or the cli wil hang
    /*
    When we have magnetURIs, send
    const message = {
        action: 'UPLOAD_FILE',
        payload: {
            consumerId: 1,
            name: 'test.txt',
            hash: 'hashOfTest.txt',
            size: 12312311231123123
            shards: [
                {name: 'test.txt.part-0', magnetURI: 'part-0-magnetURI', size: 12312112},
                {name: 'test.txt.part-1', magnetURI: 'part-1-magnetURI', size: 12312112}
            ],
        }
    };

    Tracker:
        - Save a new file with info: const newFile = {name, consumerId, hash}
        - Save shards with info: {fileId: newFile.id, name, size}
        - Start matching Producer to shards:
            - For each producer downloaded a shard:
                - When a Producer done downloading, it notifies Tracker,
                    - Tracker will save to Producer_Shards table
                    - Tracker update file's availability
                - Availability is calculated by the minimum amount of shard available in others producer
                    (count in the table Shards_Producer)

    BASIC: 3, PLUS: 5, PREMIUM: 10

    Ex: file has 3 shards, availability = 3 => each shard have 3 different producers to keep => 3 * 3 = 9 shards in the network
    Producer 1 - Shard 1, Shard 2, Shard 3
    Producer 2 - Shard 1, Shard 2, Shard 3
    Producer 3 - Shard 1, Shard 2, Shard 3

    Ex: file has 3 shards, availability = 3 => each shard have 3 different producers to keep
    Producer 4 - Shard 1, Shard 2 (don't have enough space)
    Producer 5 - Shard 1, Shard 2, Shard 3
    Producer 6 - Shard 1, Shard 2, Shard 3
    Producer 7 - Shard 3

    Ex: file has 3 shards, availability = 3 => each shard have 3 different producers to keep
    Producer 4 - Shard 1 (don't have enough space)
    Producer 5 - Shard 1, Shard 2, Shard 3
    Producer 6 - Shard 1, Shard 2, Shard 3
    Producer 7 - Shard 3, Shard 2

    FEATURE: Dynamically adjust producer. Ex: when a producer offline
    All of the shards that producer keep will be unavailable
    =>  - Delete in DB the shards that Producer is keeping
        - Update file's availability
        - Start add new producers to serve the file

    Phase 1:
    Ex: file has 3 shards, availability = 3 => each shard have 3 different producers to keep
    Producer 4 - Shard 1 (don't have enough space)
    Producer 5 - Shard 1, Shard 2, Shard 3
    Producer 6 - Shard 1, Shard 2, Shard 3
    Producer 7 - Shard 3, Shard 2

    Phase 2: Producer 4 offline => file's availability = 2
    Producer 4 - (Offline)
    Producer 5 - Shard 1, Shard 2, Shard 3
    Producer 6 - Shard 1, Shard 2, Shard 3
    Producer 7 - Shard 3, Shard 2, (new) Shard 1 (Tracker "move" the shard here (i.e: Tracker tell the producer 7 to download Shard 1))

    Storage: Create a cronjob, for each month, search database for all files of a consumer. Sum all their size & call to the contract
     */


    // return 0;
    // const file = await api.post({url: '/files', body: {magnetUris, name, consumerId}, token: CM.configs.authToken});
    // return file;
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
