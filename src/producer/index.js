/**
 * Project imports
 */
const ContractService = require('@open-bucket/contracts');
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const {connectProducerP} = require('../core/ws');

function getProducersP() {
    return api.get({url: '/producers', token: CM.configs.authToken});
}

async function createProducerP({spacePath, spaceLimit, name}) {
    function printNewProducerInfo({space, config}) {
        console.log('Created new producer space at:', space);
        console.log('Created new producer config at:', config);
    }

    const producerInfo = await api.post({
        url: '/producers',
        body: {spacePath, spaceLimit, name},
        token: CM.configs.authToken
    });

    const space = await SM.makeProducerSpace({producerId: producerInfo.id, spacePath});
    const config = await CM.writeProducerConfigFileP(producerInfo.id, {id: producerInfo.id, space, spaceLimit});

    printNewProducerInfo({space, config});

    return producerInfo;
}

function createProducerActivationP({producerId, accountIndex}) {
    return ContractService.createProducerActivationP({producerId, accountIndex});
}

// reject: serve files or receiving file is rejected
async function startProducerP(id) {
    const wsClient = await connectProducerP(id);
    wsClient
        .on('close', (param) => {
            console.log('on wsClient closed', param);
        })
        .on('error', (param) => {
            console.log('on wsClient closed', param);
        });

    console.log('Connected to Tracker server');

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
    return require('bluebird').delay(1000 * 3600); // 1 hour
}

module.exports = {
    createProducerP,
    getProducersP,
    createProducerActivationP,
    startProducerP
};
