/**
 * Project imports
 */
const {delayT, logConsoleP, constant, filterEmptyKeys} = require('../utils');
const {promptHeaderP} = require('../core/prompt');
const {writeDaemonConfigP} = require('../config-manager');

function applyConfigT({directory, size, startOnStartup}) {
    const filteredConfig = filterEmptyKeys({directory, size, startOnStartup});

    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleP('Applying new config to Producer...', null)
        .chain(constant(delayT(500))) // do applying config process here
        .chain(constant(writeDaemonConfigP({producer: filteredConfig})))
        .chain(constant(logConsoleP('Done! Applied new config to Producer: ', filteredConfig)));
}

function applyConfigPromptT() {
    const header = '---------Change Producer Config---------';

    const questions = [
        {
            type: 'input',
            name: 'directory',
            message: 'Input the path to Producer Space Directory: ',
            default: null
        },
        {
            type: 'input',
            name: 'size',
            message: 'Define the size of Producer Space Directory in `${number}${unit})` format: ',
            default: null
        },
        {
            type: 'confirm',
            name: 'startOnStartup',
            message: 'Start Producer on startup?',
            default: false
        },
    ];

    return promptHeaderP(header, questions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
