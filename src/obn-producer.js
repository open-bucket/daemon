#!/usr/bin/env node
const {prompt} = require('inquirer');
const {fromPromised} = require('folktale/concurrency/task');

const taskPrompt = fromPromised(prompt);

// changeConfig :: () -> Task
function changeConfig() {
    console.log('---------Change Producer Config---------');
    return taskPrompt([
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
            message: 'Define the size of Producer Space Directory in `${number} ${unit})` format: ',
            validate: function (value) {
                // TODO: validate input format: `${NUMBER} ${UNIT}`
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
    ]);
}

module.exports = {
    changeConfig
};
