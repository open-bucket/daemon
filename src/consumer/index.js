/**
 * Lib imports
 */
const uuid = require('uuid/v4');

/**
 * Project imports
 */
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');
const ContractService = require('@open-bucket/contracts');

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

function getConsumersP() {
    return api.get({url: '/consumers', token: CM.configs.authToken});
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

module.exports = {
    createConsumerP,
    getConsumersP,
    createConsumerActivationP
};
