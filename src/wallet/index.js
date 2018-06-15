/**
 * Project imports
 */
const {delayT, logConsoleP, constant, filterEmptyKeys} = require('../utils');
const {promptHeaderP} = require('../core/prompt');
const {writeDaemonConfigP} = require('../config-manager');

function applyConfigT({secretFilePath}) {
    const filteredConfig = filterEmptyKeys({secretFilePath});

    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleP('Applying new config to wallet...', null)
        .chain(constant(delayT(500))) // do applying config process here
        .chain(constant(writeDaemonConfigP({wallet: filteredConfig})))
        .chain(constant(logConsoleP('Done! Applied new config to Wallet: ', filteredConfig)));
}

function applyConfigPromptT() {
    const header = '---------Change Wallet Config---------';

    const questions = [
        {
            type: 'input',
            name: 'secretFilePath',
            message: 'Input the path to your secret file',
            default: null
        },
    ];

    return promptHeaderP(header, questions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
