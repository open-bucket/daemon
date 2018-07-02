#!/usr/bin/env node
// Usage: obn producer <command>. Ex: obn producer config
/**
 * Lib imports
 */
const commander = require('commander');
const generateName = require('sillyname');

/**
 * Project imports
 */
const {createProducerP, getProducersP} = require('../producer');
const {OBN_SPACES_PATH} = require('../constants');
const {logConsoleP} = require('../utils');
const {promptHeaderP} = require('../core/prompt');

function createProducerPromptP() {
    const header = '---------Create new producer---------';

    const questions = [
        {
            type: 'input',
            name: 'name',
            message: 'Input your Producer name',
            default: generateName()
        },
        {
            type: 'input',
            name: 'spacePath',
            message: 'Input the path to Producer Space Directory',
            default: OBN_SPACES_PATH
        },
        {
            type: 'input',
            name: 'spaceLimit',
            message: 'Input the Producer Space limit in GB',
            default: 5,
            validate: (value) => {
                return Number(value) > 1 || 'Your limit must be larger than 1GB';
            },
            filter: Number
        }
    ];

    return promptHeaderP(header, questions).then(createProducerP);
}

commander.command('create').description('Create new Producer with specified configs')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-n, --name <string>', 'Specify Producer name')
    .option('-p, --space-path <string>', 'Specify Producer space path')
    .option('-l, --space-limit <number>', 'Specify Producer space limit')
    .action(({detach, spacePath, spaceLimit, name}) => {
        const action = detach
            ? createProducerP({spacePath, spaceLimit, name})
            : createProducerPromptP();
        return action.catch(({data}) => logConsoleP('Create Producer error:\n', data));
    });

commander.command('ls').description('List all producers')
    .action(() => {
        return getProducersP()
            .then(logConsoleP('Producers:\n'))
            .catch(({data}) => logConsoleP('Get Producers error:\n', data));
    });

commander.parse(process.argv);
