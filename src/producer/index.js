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

async function syncP(producerId) {
    const stats = await SM.getProducerSpaceStatP(producerId);
    return stats;
}

// reject: serve files or receiving file is rejected
async function startProducerP(id) {
    console.log(`Starting Producer ${id}...`);
    const wsClient = await connectProducerP(id);

    wsClient
        .on('close', (param) => {
            // TODO
            console.log('on wsClient closed', param);
        })
        .on('error', (param) => {
            // TODO
            console.log('on wsClient closed', param);
        });

    console.log('Connected to Tracker server');

    console.log('Syncing data...');
    const result = await syncP(id);
    console.log('result of sync: ', result);
    console.log('Synced data');
    /*
    Tracker needs to know:
    - available storage (limit - current size)
    - hashes of current files in producer space
        - Tracker will check if the files is correct with the hashes in DB,
           else, a file is corrupted:
           - Tracker sends:
           {
                action: RECOVER_FILES,
                payload: [{name: 'abc-part0', magnetURI: 'the magnetURI of the shard'}]
           }
           - When Daemon receives RECOVER_FILES action, it will delete current files & download new files
    - When all files is OK
    - Syncing is done. Producer now is ready for receiving & serving files. Add the producer to connectedProducer
     */

    /*
    const wsClient = await connectProducer({url, token, {type: 'PRODUCER', id}})
                        .then(logConsoleP('Connected to Tracker server'));

    await syncFilesP(wsClient).then(logConsoleP('Synced data'))

    return logConsoleP(`Producer ${id} has been started, now receiving & serving data...`)
            .then(Promise.all([receiveData(param), serveData(param)]))

     // receiveData & serveData is 2 long running promises
     // They will log out many things: file received, progress, space status, etc...
     */
    // Step 1: connecting to tracker server
    // Step 2: syncing files
    // Step 3: producer 1 has been started
    // show file received, progress, space status, etc...
}

module.exports = {
    createProducerP,
    getProducersP,
    createProducerActivationP,
    startProducerP
};
