/**
 * Project imports
 */
const {delayT, logConsoleT} = require('../core/util');
const {promptHeaderT} = require('../core/prompt');

function applyConfigT({secretFilePath}) {
    // The code below simulates the applying config process that takes about 500ms
    // REMOVE them when we do the actual implementation
    // TODO: do the actual implementation
    return logConsoleT('Applying new config to wallet...', null)
        .chain(() => delayT(500))
        .chain(() => logConsoleT('Done! Applied new config to Wallet: ', {secretFilePath}));
}

function applyConfigPromptT() {
    const header = '---------Change Wallet Config---------';

    const promptQuestions = [
        {
            type: 'input',
            name: 'secretFilePath',
            message: 'Input the path to your secret file',
            validate: function (value) {
                // TODO: validate valid path
                // returns true if valid, the message if invalid
                return !!value;
            },
        },
    ];

    return promptHeaderT(header, promptQuestions).chain(applyConfigT);
}

module.exports = {
    applyConfigPromptT,
    applyConfigT
};
