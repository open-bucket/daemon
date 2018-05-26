#!/usr/bin/env node
const {prompt} = require('inquirer');
const {fromPromised} = require('folktale/concurrency/task');

const taskPrompt = fromPromised(prompt);

// changeConfig :: () -> Task
function changeConfig() {
    console.log('---------Change Consumer Config---------');
    return taskPrompt([
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
    ]);
    /*
    {
        directory: '/path/to/consumer/space/dir'
        startOnStartup: false
    }
     */
    // TODO: map answer to task
    // TODO: apply the new consumer space dir
    // TODO: make startOnStartup take effect
    // TODO: edit ../config.json
}

module.exports = {
    changeConfig
};
