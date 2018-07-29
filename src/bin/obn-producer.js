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
const {
    createProducerP,
    getAllProducersP,
    createProducerActivationP,
    startProducerP,
    withdrawP,
    getBalanceP
} = require('../producer');
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
        .then(getAllProducersP)
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
        .then(getAllProducersP)
        .then(createChooseActivatedProducerPromptP)
        .then(({producerId}) => startProducerP(producerId));
}

async function withdrawPromptP() {
    function chooseActiveProducerAndContractAddressPrompt(producers) {
        const question = [
            {
                type: 'list',
                name: 'producerId',
                message: 'Choose a Producer to withdraw',
                choices: sort((a, b) => a.id - b.id)(producers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === PRODUCER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            },
            {
                type: 'input',
                name: 'contractAddress',
                message: 'Input the Consumer contract address',
                validate: (value) => !!value || 'Use must specify Consumer contract address to withdraw from'
            }
        ];

        return prompt(question);
    }

    function confirmWithdrawPromptP({contractAddress, address}) {
        const question = [
            {
                type: 'confirm',
                name: 'confirmWithdraw',
                message: `You are about to withdraw all your earned payment from contract ${contractAddress} to address ${address}. Are you sure?`,
                default: false
            }
        ];

        return prompt(question);
    }

    console.log('---------Withdraw---------');
    const producers = await getAllProducersP();
    const {producerId, contractAddress} = await chooseActiveProducerAndContractAddressPrompt(producers);

    const chosenProducer = producers.find(c => c.id === producerId);
    const {confirmWithdraw} = await confirmWithdrawPromptP({address: chosenProducer.address, contractAddress});

    return confirmWithdraw
        && withdrawP(producerId, contractAddress)
            .then(() => logConsoleP('Withdraw successfully', null));
}

async function getBalancePromptP() {
    function chooseActiveProducerPrompt(producers) {
        const question = [
            {
                type: 'list',
                name: 'producerId',
                message: 'Choose a Producer',
                choices: sort((a, b) => a.id - b.id)(producers)
                    .map(producer => ({
                        name: `${producer.id} ${producer.name}`,
                        disabled: producer.state === PRODUCER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            }
        ];

        return prompt(question);
    }

    console.log('---------Get Balance---------');
    const producers = await getAllProducersP();
    const {producerId} = await chooseActiveProducerPrompt(producers);

    return getBalanceP(producerId);
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
        return getAllProducersP()
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

commander.command('withdraw').description('Withdraw from a Consumer contract')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --producer-id <number>', 'Specify Producer id', Number)
    .option('-a, --contract-address <number>', 'Specify Contract address')
    .action(({detach, producerId, contractAddress}) => {
        const action = detach
            ? withdrawP(producerId, contractAddress)
            : withdrawPromptP();
        return action
            .catch(({message}) => logConsoleP('Withdraw error:\n', message));
    });

commander.command('getBalance').description('Get Balance of a producer')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --producer-id <number>', 'Specify Producer id', Number)
    .action(({detach, producerId}) => {
        const action = detach
            ? getBalanceP(producerId)
            : getBalancePromptP();
        return action
            .then((balance) => logConsoleP('Your current producer balance:', balance.toString()))
            .catch(({message}) => logConsoleP('Get Balance error:\n', message));
    });

commander.parse(process.argv);
