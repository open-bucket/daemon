#!/usr/bin/env node

/**
 * Lib imports
 */
const debug = require('debug')('obn');
const commander = require('commander');
const Task = require('folktale/concurrency/task');

/**
 * Project imports
 */
const Wallet = require('./wallet');
const Consumer = require('./consumer');
const Producer = require('./producer');
const {trace} = require('./core/util');
const {promptHeaderT} = require('./core/prompt');

commander.version('0.0.1');

commander.command('config').description('Apply config to Open Bucket components')
    .action(function obnConfigs() {
        const header = '---------Daemon Init---------';

        function changeConfigT(name) {
            const mapper = {
                'Wallet': Wallet.applyConfigPromptT,
                'Consumer': Consumer.applyConfigPromptT,
                'Producer': Producer.applyConfigPromptT
            };
            return mapper[name]();
        }

        const initQuestions = [{
            type: 'checkbox',
            message: 'Select components to init',
            name: 'components',
            choices: [
                {name: 'Wallet', checked: true},
                {name: 'Consumer', checked: true},
                {name: 'Producer'},
            ],
            validate: (answer) => answer.length > 1 || 'You must choose at least one component.'
        }];

        return promptHeaderT(header, initQuestions)
            .chain(({components}) =>
                components.reduce((previousTask, cmpName) =>
                    previousTask.chain(() => changeConfigT(cmpName)), Task.of(1)))
            .map(trace(debug, 'answer: '))
            .run()
            .promise();
    });

// Sub-commands
commander
    .command('wallet', 'Wallet functionality')
    .command('consumer', 'Consumer functionality')
    .command('producer', 'Producer functionality');

commander.parse(process.argv);

