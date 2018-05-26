/**
 * Project imports
 */
const {delayT, logConsoleT} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');

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

    const promptQuestions = [
        {
            type: 'input',
            name: 'directory',
            message: 'Input the path to Producer Space Directory: ',
            validate: function (value) {
                // TODO: validate valid path
                // returns true if valid, the message if invalid
                return !!value;
            },
        },
        {
            type: 'input',
            name: 'size',
            message: 'Define the size of Producer Space Directory in `${number}${unit})` format: ',
            validate: function (value) {
                // TODO: validate input format: `${NUMBER}${UNIT}`
                // returns true if valid, the message if invalid
                return !!value;
            }
        },
        {
            type: 'confirm',
            name: 'startOnStartup',
            message: 'Start Producer on startup?',
            default: false
        },
    ];

    return promptHeaderT(header, promptQuestions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
