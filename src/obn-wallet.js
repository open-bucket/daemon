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
const {delayT, trace} = require('./core/util');


// changeConfig :: () -> Task
function changeConfig() {
    console.log('---------Change Wallet Config---------');
    return promptT([
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
    ]).chain(() => {
        console.log('Applying new config...');

        // The below line of code simulates the change config process
        // that takes about 500ms
        // REMOVE this when we do the actual implementation
        // TODO: do the actual implementation
        return delayT(500).map(trace(console.log, 'Done.'));
    });
}

module.exports = {
    changeConfig
};
