#!/usr/bin/env node
// Usage: obn consumer <command>. Ex: obn consumer config
/**
 * Lib imports
 */
const debug = require('debug')('obn-consumer');
const commander = require('commander');

/**
 * Project imports
 */
const {applyConfigPromptT, applyConfigT} = require('./consumer');

commander.command('config').description('Apply new Consumer Config')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-r, --directory <string>', 'Specify Consumer space')
    .option('-s, --start-on-startup <bool>', 'Specify to start Consumer on startup')
    .action(function applyNewConsumerConfig({detach, ...rest}) {
        const applyConfigTask = detach
            ? applyConfigT(rest)
            : applyConfigPromptT();
        return applyConfigTask.run().promise();
    });

commander.command('start').description('Start Consumer')
    .action(function startConsumer() {
        // This is just an example how to add another command to obn-consumer.
        // TODO: implement this
        debug('startConsumer is called');
    });

commander.parse(process.argv);

module.exports = {
    applyConfigPromptT
};
