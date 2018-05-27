#!/usr/bin/env node
// Usage: obn producer <command>. Ex: obn producer config
/**
 * Lib imports
 */
const debug = require('debug')('obn-producer');
const commander = require('commander');

/**
 * Project imports
 */
const {applyConfigPromptT, applyConfigT} = require('./producer');

commander.command('config').description('Apply new Consumer Config')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-r, --directory <string>', 'Specify Producer space directory')
    .option('-z, --size <string>', 'Specify size of Producer space directory')
    .option('-s, --start-on-startup <bool>', 'Specify to start Producer on startup')
    .action(function applyNewProducerConfig({detach, ...rest}) {
        const applyConfigTask = detach
            ? applyConfigT(rest)
            : applyConfigPromptT();
        return applyConfigTask.run().promise();
    });

commander.command('start').description('Start Producer')
    .action(function startProducer() {
        // This is just an example how to add another command to obn-producer.
        // TODO: implement this
        debug('startProducer is called');
    });

commander.parse(process.argv);

module.exports = {
    applyConfigPromptT
};
