/**
 * Project imports
 */
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');

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


module.exports = {
    createProducerP,
    getProducersP
};
