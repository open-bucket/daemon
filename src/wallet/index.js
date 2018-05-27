/**
 * Project imports
 */
const {delayT, logConsoleT, constant, filterEmptyKeys} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');
const {writeConfigFileT} = require('../core/config');

function applyConfigT({secretFilePath}) {
    const filteredConfig = filterEmptyKeys({secretFilePath});

    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleT('Applying new config to wallet...', null)
        .chain(constant(delayT(500))) // do applying config process here
        .chain(constant(writeConfigFileT({wallet: filteredConfig})))
        .chain(constant(logConsoleT('Done! Applied new config to Wallet: ', filteredConfig)));
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

    return promptHeaderT(header, questions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
