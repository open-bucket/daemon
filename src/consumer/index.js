/**
 * Project imports
 */
const {delayT, logConsoleT} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');
const {readConfigFileT} = require('../core/config');

function applyConfigT({directory, startOnStartup}) {
    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleT('Applying new config to Consumer...', null)
        .chain(() => delayT(500))
        .chain(() => logConsoleT('Done! Applied new config to Consumer: ', {directory, startOnStartup}));
}

function applyConfigPromptT() {
    const header = '---------Change Consumer Config---------';

    return readConfigFileT()
        .chain(({consumer}) => promptHeaderT(header, [
            {
                type: 'input',
                name: 'directory',
                message: 'Input the path to Consumer Space Directory',
                default: consumer.directory
            },
            {
                type: 'confirm',
                name: 'startOnStartup',
                message: 'Start Open Bucket Consumer on startup?',
                default: consumer.startOnStartup
            },
        ]))
        .chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
