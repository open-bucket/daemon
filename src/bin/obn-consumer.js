#!/usr/bin/env node

/**
 * Lib imports
 */
const commander = require('commander');
const {head, split, compose} = require('ramda');
const BigNumber = require('bignumber.js');
const generateName = require('sillyname');

/**
 * Project imports
 */
const {getConsumersP, createConsumerP, createActivationP} = require('../consumer');
const {logConsoleP} = require('../utils');
const {promptHeaderP, prompt} = require('../core/prompt');
const ContractService = require('@open-bucket/contracts');
const {CONSUMER_STATES, CONSUMER_TIERS} = require('../enums');

function createConsumerPromptP() {
    const header = '---------Create new consumer---------';

    const questions = [
        {
            type: 'input',
            name: 'name',
            message: 'Input your consumer name',
            default: generateName()
        },
        {
            type: 'list',
            name: 'tier',
            message: 'Choose your consumer tier',
            choices: Object.values(CONSUMER_TIERS)
        }
    ];

    return promptHeaderP(header, questions).then(createConsumerP);
}

async function createActivationPromptP() {

    // get consumer list first
    function createChooseConsumerPromptP(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose your consumer to activate',
                choices: consumers
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state !== CONSUMER_STATES.INACTIVE && 'Active'
                    })),
                filter: compose(Number, head, split(' ')) // get consumerId
            }
        ];

        return prompt(question);
    }

    function createChooseAccountPromptP(accounts) {
        const questions = [
            {
                type: 'list',
                name: 'accountIndex',
                message: 'Choose your Ethereum address',
                choices: accounts
                    .map((account, index) => ({name: `${index} ${account.address}`})),
                filter: compose(Number, head, split(' ')) // get account index
            }
        ];

        return prompt(questions);
    }

    function createInputValuePromptP() {
        const questions = [
            {
                type: 'input',
                name: 'value',
                message: 'Input your upfront payment value in Wei',
                default: ContractService.configs.ACTIVATOR_MIN_AMOUNT,
                validate: (value) => {
                    const bnValue = new BigNumber(value);
                    const bnMinAmount = new BigNumber(ContractService.configs.ACTIVATOR_MIN_AMOUNT);
                    if (bnValue.isGreaterThanOrEqualTo(bnMinAmount))
                        return true;

                    return 'Your upfront payment value should be larger than the default value';
                }
            }
        ];

        return prompt(questions);
    }

    console.log('---------Activate Consumer---------');
    const {consumerId} = await logConsoleP('Loading your consumers...', null)
        .then(getConsumersP)
        .then(createChooseConsumerPromptP);

    const {accountIndex} = await logConsoleP('Loading your accounts...', null)
        .then(::ContractService.getAccountsP)
        .then(createChooseAccountPromptP);

    const {value} = await createInputValuePromptP();

    return createActivationP({
        consumerId,
        accountIndex,
        value
    });
}

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
    .action(function listConsumers() {
        return getConsumersP()
            .then(logConsoleP('Consumers:\n'))
            .catch(({data}) => logConsoleP('Get Consumers error:\n', data));
    });

commander.command('activate').description('Activate a Consumer')
    .action(function activateConsumer() {
        return createActivationPromptP()
            .then(() => logConsoleP('Your consumer is being activated, please check its status after a few minutes', null))
            .catch((error) => logConsoleP('Activate Consumers error:\n', error));
    });

commander.parse(process.argv);

module.exports = {};
