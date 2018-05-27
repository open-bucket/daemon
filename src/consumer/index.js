/**
 * Project imports
 */
const {delayT, logConsoleT} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');

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

    const promptQuestions = [
        {
            type: 'input',
            name: 'directory',
            message: 'Input the path to Consumer Space Directory',
            validate: function (value) {
                // TODO: validate valid path
                return !!value;
            },
        },
        {
            type: 'confirm',
            name: 'startOnStartup',
            message: 'Start Open Bucket Consumer on startup?',
            default: false
        },
    ];

    return promptHeaderT(header, promptQuestions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
