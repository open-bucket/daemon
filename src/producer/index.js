/**
 * Project imports
 */
const {delayT, logConsoleT} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');
const {readConfigFileT} = require('../core/config');

function applyConfigT({directory, size, startOnStartup}) {
    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleT('Applying new config to Producer...', null)
        .chain(() => delayT(500))
        .chain(() => logConsoleT('Done! Applied new config to Producer: ', {directory, size, startOnStartup}));
}

function applyConfigPromptT() {
    const header = '---------Change Producer Config---------';

    return readConfigFileT()
        .chain(({producer}) => promptHeaderT(header, [
            {
                type: 'input',
                name: 'directory',
                message: 'Input the path to Producer Space Directory: ',
                default: producer.directory
            },
            {
                type: 'input',
                name: 'size',
                message: 'Define the size of Producer Space Directory in `${number}${unit})` format: ',
                default: producer.size
            },
            {
                type: 'confirm',
                name: 'startOnStartup',
                message: 'Start Producer on startup?',
                default: producer.startOnStartup
            },
        ]))
        .chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
