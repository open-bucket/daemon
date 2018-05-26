#!/usr/bin/env node
/**
 * Lib imports
 */
const {prompt} = require('inquirer');
const {fromPromised} = require('folktale/concurrency/task');

const taskPrompt = fromPromised(prompt);

/**
 * Project imports
 */
const {delayT, logConsoleT} = require('./core/util');

function applyConfigPromptT() {
    console.log('---------Change Consumer Config---------');

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

    return taskPrompt(promptQuestions)
        .chain(() => {
            console.log('Applying new config...');

            // The below line of code simulates the applying config process
            // that takes about 500ms
            // REMOVE this when we do the actual implementation in ./consumer/index.js
            // TODO: do the actual implementation in ./consumer/index.js
            return delayT(500);
        })
        .chain(logConsoleT('Done.'));
}

module.exports = {
    applyConfigPromptT
};
