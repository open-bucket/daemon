#!/usr/bin/env node

/**
 * Lib imports
 */
const commander = require('commander');

/**
 * Project imports
 */
const {getConsumersP, createConsumerP, createConsumerPromptP} = require('../consumer');
const {logConsoleP} = require('../utils');

commander.command('create').description('Create new Consumer with specified configs')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-a, --address <address>', 'Specify user Eth address (required)')
    .option('-r, --directory <consumerPath>', 'Specify Consumer space')
    .action(({detach, address, directory}) => {
        const action = detach
            ? createConsumerP({address, directory})
            : createConsumerPromptP();
        return action.catch(({data}) => logConsoleP('Create Consumer error:\n', data));
    });

commander.command('ls').description('List all consumers')
    .action(function startConsumer() {
        return getConsumersP()
            .then(logConsoleP('Consumers:\n'))
            .catch(({data}) => logConsoleP('Get Consumers error:\n', data));
    });

commander.parse(process.argv);

module.exports = {};
