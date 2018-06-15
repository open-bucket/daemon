/**
 * Project imports
 */
const {promptHeaderP} = require('../core/prompt');
const CM = require('../config-manager');
const SM = require('../space-manager');
const api = require('../core/api');

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

function getConsumersP() {
    return api.get({url: '/consumers', token: CM.configs.authToken});
}

async function createConsumerP({address}) {
    const newConsumerInfo = await api.post({url: '/consumers', body: {address}, token: CM.configs.authToken});
    const {id, key} = newConsumerInfo;
    console.log('Your new consumer key:', key);
    console.log('Please secure your consumer key since you will need it for further interactions with this consumer');

    const consumerSpace = await SM.makeConsumerSpace(id);
    console.log('Created new consumer space at:', consumerSpace);

    const consumerConfigFilePath = await CM.writeConsumerConfigFileP(id, {id, key, consumerSpace});
    console.log('Created new consumer config at:', consumerConfigFilePath);

    return newConsumerInfo;
}

function createConsumerPromptP() {
    const header = '---------Create new consumer---------';

    const questions = [
        {
            type: 'input',
            name: 'address',
            message: 'Input your Ethereum address'
        }
    ];

    return promptHeaderP(header, questions).then(createConsumerP);
}

module.exports = {
    createConsumerPromptP,
    createConsumerP,
    getConsumersP
};
