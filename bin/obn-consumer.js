#!/usr/bin/env node
// Usage: obn consumer <command>. Ex: obn consumer config
/**
 * Lib imports
 */
const commander = require('commander');

/**
 * Project imports
 */
const {getConsumersP, createConsumerP, createConsumerPromptP} = require('../src/consumer');
const {logConsoleP} = require('../src/utils');

commander.command('create').description('Create new Consumer with specified configs')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-a, --address <address>', 'Specify user Eth address (required)')
    .option('-r, --directory <consumerPath>', 'Specify Consumer space')
    .action(({detach, address, directory}) => {
        const action = detach
            ? createConsumerP({address, directory})
            : createConsumerPromptP();
        return action.catch(logConsoleP('Create Consumer error:\n'));
    });

commander.command('ls').description('List all consumers')
    .action(function startConsumer() {
        return getConsumersP()
            .then(logConsoleP('Consumers:\n'))
            .catch(logConsoleP('Get Consumers error:\n'));
    });

commander.parse(process.argv);

module.exports = {};
