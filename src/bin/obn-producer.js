#!/usr/bin/env node
// Usage: obn producer <command>. Ex: obn producer config
/**
 * Lib imports
 */
const commander = require('commander');
const {head, split, compose, sort} = require('ramda');
const generateName = require('sillyname');
const bytes = require('bytes');

/**
 * Project imports
 */
const {createProducerP, getProducersP, createProducerActivationP, startProducerP} = require('../producer');
const {OBN_SPACES_PATH} = require('../constants');
const {PRODUCER_STATES} = require('../enums');
const {logConsoleP} = require('../utils');
const {promptHeaderP, prompt} = require('../core/prompt');
const ContractService = require('@open-bucket/contracts');

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
            message: 'Input the Producer Space limit',
            default: '5 GB',
            validate: (value) => {
                const valueInByte = bytes.parse(value);
                const oneGB = bytes.parse('1 GB');
                if (!valueInByte) {
                    return 'Your input is not valid';
                }
                return valueInByte >= oneGB || 'Your limit must be larger or equal 1 GB';
            }
        }
    ];

    return promptHeaderP(header, questions).then(createProducerP);
}


async function createProducerActivationPromptP() {
    function createChooseInactiveProducerPromptP(producers) {
        const question = [
            {
                type: 'list',
                name: 'producerId',
                message: 'Choose a Producer to activate',
                choices: sort((a, b) => a.id - b.id)(producers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state !== PRODUCER_STATES.INACTIVE && 'Activated'
                    })),
                filter: compose(Number, head, split(' ')) // get producerId
            }
        ];

        return prompt(question);
    }

    function createChooseAccountPromptP(accounts) {
        const questions = [
            {
                type: 'list',
                name: 'accountIndex',
                message: 'Choose an Ethereum address',
                choices: accounts
                    .map((account, index) => ({name: `${index} ${account.address}`})),
                filter: compose(Number, head, split(' ')) // get account index
            }
        ];

        return prompt(questions);
    }

    console.log('---------Activate Producer---------');
    const {producerId} = await logConsoleP('Loading your producers...', null)
        .then(getProducersP)
        .then(createChooseInactiveProducerPromptP);

    const {accountIndex} = await logConsoleP('Loading your accounts...', null)
        .then(::ContractService.getAccountsP)
        .then(createChooseAccountPromptP);

    return createProducerActivationP({
        producerId,
        accountIndex,
    });
}

function startProducerPromptP() {

    function createChooseActivatedProducerPromptP(producers) {
        const question = [
            {
                type: 'list',
                name: 'producerId',
                message: 'Choose a Producer to start',
                choices: sort((a, b) => a.id - b.id)(producers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === PRODUCER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' ')) // get producerId
            }
        ];

        return prompt(question);
    }

    console.log('---------Start Producer---------');
    return logConsoleP('Loading your producers...', null)
        .then(getProducersP)
        .then(createChooseActivatedProducerPromptP)
        .then(({producerId}) => startProducerP(producerId));
}

commander.command('create').description('Create new Producer with specified configs')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-n, --name <string>', 'Specify Producer name', generateName())
    .option('-p, --space-path <string>', 'Specify Producer space path')
    .option('-l, --space-limit <string>', 'Specify Producer space limit', '5 GB')
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

commander.command('activate').description('Activate Producer')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-a, --account-index <number>', 'Specify account index', Number)
    .option('-p, --producer-id <number>', 'Specify Producer id', Number)
    .action(({detach, accountIndex, producerId}) => {
        const action = detach
            ? createProducerActivationP({producerId, accountIndex})
            : createProducerActivationPromptP();
        return action
            .then(() => logConsoleP('Your producer activation has been created, your producer will be activated after a while', null))
            .catch((error) => logConsoleP('Activate Producer error:\n', error));
    });

commander.command('start').description('Start Producer')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --producer-id <number>', 'Specify Producer id', Number)
    .action(({detach, producerId}) => {
        const action = detach
            ? startProducerP(producerId)
            : startProducerPromptP();
        return action
            .catch(({message}) => logConsoleP('Start Producer error:\n', message));
    });

commander.parse(process.argv);
