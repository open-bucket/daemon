#!/usr/bin/env node

/**
 * Lib imports
 */
const debug = require('debug')('obn');
const commander = require('commander');
const Task = require('folktale/concurrency/task');
const {prompt} = require('inquirer');

const promptT = Task.fromPromised(prompt);

/**
 * Project imports
 */
const WalletCLI = require('./obn-wallet');
const ConsumerCLI = require('./obn-consumer');
const ProducerCLI = require('./obn-producer');
const {trace} = require('./core/util');


// init config
// config got init each time on start command
// e.g.
//  - obn consumer start
//  - obn producer start
// consumer & producer also init wallet config
// they use wallet internally

commander.version('0.0.1');

commander
    .command('config')
    .description('Apply config to Open Bucket components')
    .action(function obnConfigs() {
        console.log('---------Daemon Init---------');

        function changeConfigT(name) {
            const mapper = {
                'Wallet': WalletCLI.applyConfigPromptT,
                'Consumer': ConsumerCLI.applyConfigPromptT,
                'Producer': ProducerCLI.applyConfigPromptT
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

        return promptT(initQuestions)
            .chain(({components}) =>
                components.reduce((previousTask, cmpName) =>
                    previousTask.chain(() => changeConfigT(cmpName)), Task.of(1)))
            .map(trace(debug, 'answer: '))
            .run()
            .promise();
    });

commander
    .command('consumer', 'Producer functionality');

commander
    .command('producer', 'Producer functionality');


commander.parse(process.argv);