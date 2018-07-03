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
    async function reportSpaceStatsP(producerId) {
        const stats = await SM.getProducerSpaceStatP(producerId);
        return wsClient.send(JSON.stringify({
            action: WS_ACTIONS.REPORT_PRODUCER_SPACE_STATS,
            payload: stats
        }));
    }

    function handleMessage(rawMessage) {
        const {action, payload} = JSON.parse(rawMessage);
        switch (action) {
            // TODO: this is just the demo action. Change this when we do actual implementation
            case WS_ACTIONS.RECOVER_DATA:
                console.log('RECOVER_DATA received', payload);
        }
        console.log('on wsClient message', {action, payload});
    }

    function handleClose(code) {
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
    await reportSpaceStatsP(id);
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
