/**
 * Lib imports
 */
const path = require('path');

/**
 * Project imports
 */
const ContractService = require('@open-bucket/contracts');
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const {connectProducerP} = require('../core/ws');
const {OBN_SPACES_PATH} = require('../constants');
const {createDebugLogger} = require('../utils');
const {WS_ACTIONS} = require('../enums');
const WebTorrentClient = require('../webtorrent-client');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('producer');

function getProducersP() {
    return api.get({url: '/producers', token: CM.configs.authToken});
}

async function createProducerP({spacePath = OBN_SPACES_PATH, spaceLimit = '5 GB', name}) {
    function printNewProducerInfo({space, config}) {
        console.log('Created new producer space at:', space);
        console.log('Created new producer config at:', config);
    }

    const producerInfo = await api.post({
        url: '/producers',
        body: {spacePath, spaceLimit, name},
        token: CM.configs.authToken
    });

    const space = await SM.makeProducerSpaceP({producerId: producerInfo.id, spacePath});
    const config = await CM.writeProducerConfigFileP(producerInfo.id, {id: producerInfo.id, space, spaceLimit});

    printNewProducerInfo({space, config});

    return producerInfo;
}

function createProducerActivationP({producerId, accountIndex}) {
    return ContractService.createProducerActivationP({producerId, accountIndex});
}

async function startProducerP(id) {
    async function reportSpaceStatsP() {
        const stats = await SM.getProducerSpaceStatP(id);
        return wsClient.send(JSON.stringify({
            action: WS_ACTIONS.PRODUCER_REPORT_SPACE_STATS,
            payload: stats
        }));
    }

    async function handleProducerShardOrderP({name, magnetURI, size}) {
        const {space} = await CM.readProducerConfigFileP(id);
        const {availableSpace} = await SM.getProducerSpaceStatP(id);

        log('Handling PRODUCER_SHARD_ORDER', name);

        if (availableSpace > size) {
            const filePath = path.join(space, name);
            await WebTorrentClient.addP(magnetURI, {filePath});
            const hash = await SM.fileToHashP(filePath);
            const message = {
                action: WS_ACTIONS.PRODUCER_SHARD_ORDER_CONFIRM,
                payload: {name, hash, size}
            };
            wsClient.send(JSON.stringify(message));
            return {name, hash, size};
        } else {
            log('Producer space limit is reached, skip PRODUCER_SHARD_ORDER', null);
        }
    }

    function handleMessage(rawMessage) {
        const {action, payload} = JSON.parse(rawMessage);
        switch (action) {
            case WS_ACTIONS.PRODUCER_SHARD_ORDER:
                handleProducerShardOrderP(payload)
                    .then(() => log('Handled PRODUCER_SHARD_ORDER', payload.name))
                    .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }
    }

    function handleClose(code) {
        // TODO: delete all files in producer space
        console.log('wsClient closed with code', code);
    }

    function handleError(error) {
        console.log('wsClient error with error', error);
    }

    console.log(`Starting Producer ${id}...`);
    const wsClient = await connectProducerP(id);

    // NOTICE: WS connection is the root that keep this fn from being terminated
    wsClient
        .on('message', handleMessage)
        .on('close', handleClose)
        .on('error', handleError);

    console.log('Connected to Tracker server');


    console.log('Gathering producer space stats...');
    await reportSpaceStatsP();
    console.log('Reported producer space stats...');

    /*
    TODO:
    Step 1: Daemon connects to Tracker WS
    Step 2:
     - Daemon gathers local Producer space stats & report to Tracker.
     - Tracker process local Producer space stat & start dispatching actions to daemon to sync file (recover or remove)
         - Tracker checks data correctness of local Producer space if there're corrupted files:
               - Tracker sends:
               {
                    action: RECOVER_FILES,
                    payload: [{name: 'abc-part0', magnetURI: 'the magnetURI of the shard'}]
               }
               - When Daemon receives RECOVER_FILES action, it deletes current files & download new files
    Step 3: Daemon listens on messages from Tracker & show stats: action received, progress, space status, etc...
     */
}

module.exports = {
    createProducerP,
    getProducersP,
    createProducerActivationP,
    startProducerP
};
