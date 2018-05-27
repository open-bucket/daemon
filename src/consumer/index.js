/**
 * Project imports
 */
const {delayT, logConsoleT, constant, filterEmptyKeys} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');
const {writeConfigFileT} = require('../core/config');

function applyConfigT({directory, startOnStartup}) {
    const filteredConfig = filterEmptyKeys({directory, startOnStartup});

    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleT('Applying new config to Consumer...', null)
        .chain(constant(delayT(500)))
        .chain(constant(writeConfigFileT({consumer: filteredConfig})))
        .chain(constant(logConsoleT('Done! Applied new config to Consumer: ', filteredConfig)));
}

function applyConfigPromptT() {
    const header = '---------Change Consumer Config---------';

    const questions = [
        {
            type: 'input',
            name: 'directory',
            message: 'Input the path to Consumer Space Directory',
            default: null
        },
        {
            type: 'confirm',
            name: 'startOnStartup',
            message: 'Start Open Bucket Consumer on startup?',
            default: false
        },
    ];

    return promptHeaderT(header, questions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
