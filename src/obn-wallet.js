#!/usr/bin/env node
/**
 * Lib imports
 */
const {prompt} = require('inquirer');
const {fromPromised} = require('folktale/concurrency/task');

const promptT = fromPromised(prompt);

/**
 * Project imports
 */
const {delayT, logConsoleT} = require('./core/util');

function applyConfigPromptT() {
    console.log('---------Change Wallet Config---------');

    const promptQuestions = [
        {
            type: 'input',
            name: 'secretPath',
            message: 'Input the path to your secret file',
            validate: function (value) {
                // TODO: validate valid path
                // returns true if valid, the message if invalid
                return !!value;
            },
        },
    ];

    return promptT(promptQuestions)
        .chain(() => {
            console.log('Applying new config...');

            // The below line of code simulates the applying config process
            // that takes about 500ms
            // REMOVE this when we do the actual implementation in ./wallet/index.js
            // TODO: do the actual implementation in ./wallet/index.js
            return delayT(500);
        })
        .chain(logConsoleT('Done.'));
}

module.exports = {
    applyConfigPromptT
};
