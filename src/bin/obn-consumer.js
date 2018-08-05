#!/usr/bin/env node

/**
 * Lib imports
 */
const commander = require('commander');
const {head, split, compose, sort, zipObj} = require('ramda');
const BigNumber = require('bignumber.js');
const generateName = require('sillyname');
const BPromise = require('bluebird');

/**
 * Project imports
 */
const {
    getAllConsumersP,
    getConsumerP,
    getConsumerFileP,
    createConsumerP,
    createConsumerActivationP,
    uploadP,
    downloadP,
    withdrawP,
    deleteFileP,
    getBalanceP,
    topUpP,
    getBalanceInConsumerContractP
} = require('../consumer');
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

    function chooseInactiveConsumerPromptP(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose a Consumer to activate',
                choices: sort((a, b) => a.id - b.id)(consumers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state !== CONSUMER_STATES.INACTIVE && 'Activated'
                    })),
                filter: compose(Number, head, split(' ')) // get consumerId
            }
        ];

        return prompt(question);
    }

    function chooseAccountPromptP(accounts) {
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

    function inputValuePromptP() {
        const questions = [
            {
                type: 'input',
                name: 'value',
                message: 'Input your upfront payment value in Wei',
                default: ContractService.configs.CONSUMER_ACTIVATOR_MIN_AMOUNT,
                validate: (value) => {
                    const bnValue = new BigNumber(value);
                    const bnMinAmount = new BigNumber(ContractService.configs.CONSUMER_ACTIVATOR_MIN_AMOUNT);
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
        .then(getAllConsumersP)
        .then(chooseInactiveConsumerPromptP);

    const {accountIndex} = await logConsoleP('Loading your accounts...', null)
        .then(::ContractService.getAccountsP)
        .then(chooseAccountPromptP);

    const {value} = await inputValuePromptP();

    return createConsumerActivationP({
        consumerId,
        accountIndex,
        value
    });
}

async function uploadPromptP() {
    function chooseConsumerAndInputFilePathPrompt(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose a Consumer to upload',
                choices: sort((a, b) => a.id - b.id)(consumers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            },
            {
                type: 'input',
                name: 'filePath',
                message: 'Input path to the file',
            }
        ];

        return prompt(question);
    }

    console.log('---------Upload file---------');
    const {consumerId, filePath} = await logConsoleP('Loading your consumers...', null)
        .then(getAllConsumersP)
        .then(chooseConsumerAndInputFilePathPrompt);

    return uploadP({consumerId, filePath});
}

async function downloadPromptP() {

    function chooseActiveConsumerPrompt(consumers) {
        const questions = [{
            type: 'list',
            name: 'consumerId',
            message: 'Choose a Consumer to download',
            choices: sort((a, b) => a.id - b.id)(consumers)
                .map(consumer => ({
                    name: `${consumer.id} ${consumer.name}`,
                    disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                })),
            filter: compose(Number, head, split(' '))
        }];

        return prompt(questions);
    }

    function chooseFilePrompt(files) {
        const questions = [{
            type: 'list',
            name: 'fileId',
            message: 'Choose a File to download',
            choices: sort((a, b) => a.id - b.id)(files)
                .map(file => ({
                    name: `${file.id} ${file.name}`
                })),
            filter: compose(Number, head, split(' '))
        }];

        return prompt(questions);
    }

    function inputDownloadPathPrompt() {
        const questions = [{
            type: 'input',
            name: 'downloadPath',
            message: 'Input download Path',
        }];

        return prompt(questions);
    }

    console.log('---------Download file---------');
    const {consumerId} = await logConsoleP('Loading your consumers...', null)
        .then(getAllConsumersP)
        .then(chooseActiveConsumerPrompt);

    const {fileId} = await logConsoleP('Loading you files', null)
        .then(() => getConsumerFileP(consumerId))
        .then(chooseFilePrompt);

    const {downloadPath} = await inputDownloadPathPrompt();

    return downloadP({consumerId, fileId, downloadPath});
}

async function deleteFilePromptP() {

    function chooseActiveConsumerPrompt(consumers) {
        const questions = [{
            type: 'list',
            name: 'consumerId',
            message: 'Choose a Consumer to delete file from',
            choices: sort((a, b) => a.id - b.id)(consumers)
                .map(consumer => ({
                    name: `${consumer.id} ${consumer.name}`,
                    disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                })),
            filter: compose(Number, head, split(' '))
        }];

        return prompt(questions);
    }

    function chooseFilePrompt(files) {
        const questions = [{
            type: 'list',
            name: 'fileId',
            message: 'Choose a File to delete',
            choices: sort((a, b) => a.id - b.id)(files)
                .map(file => ({
                    name: `${file.id} ${file.name}`
                })),
            filter: compose(Number, head, split(' '))
        }];

        return prompt(questions);
    }

    console.log('---------Delete file---------');
    const {consumerId} = await logConsoleP('Loading your consumers...', null)
        .then(getAllConsumersP)
        .then(chooseActiveConsumerPrompt);

    const {fileId} = await logConsoleP('Loading you files', null)
        .then(() => getConsumerFileP(consumerId))
        .then(chooseFilePrompt);

    return deleteFileP({consumerId, fileId});
}

async function withdrawPromptP() {
    function chooseActiveConsumerPrompt(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose a Consumer to withdraw',
                choices: sort((a, b) => a.id - b.id)(consumers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            }
        ];

        return prompt(question);
    }

    function confirmWithdrawPromptP({contractAddress, address}) {
        const question = [
            {
                type: 'confirm',
                name: 'confirmWithdraw',
                message: `You are about to withdraw all your upfront payment from contract ${contractAddress} to address ${address}. Are you sure?`,
                default: false
            }
        ];

        return prompt(question);
    }

    console.log('---------Withdraw---------');
    const consumers = await getAllConsumersP();
    const {consumerId} = await chooseActiveConsumerPrompt(consumers);

    const chosenConsumer = consumers.find(c => c.id === consumerId);
    const {confirmWithdraw} = await confirmWithdrawPromptP(chosenConsumer);

    return confirmWithdraw
        && withdrawP(consumerId)
            .then(() => logConsoleP('Withdraw successfully. You need to add your upfront payment to keep your files on the Network or download them', null));
}

async function getBalancePromptP() {
    function chooseActiveConsumerAddress(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose a Consumer',
                choices: sort((a, b) => a.id - b.id)(consumers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            }
        ];

        return prompt(question);
    }

    console.log('---------Get Balance---------');
    const consumer = await getAllConsumersP();
    const {consumerId} = await chooseActiveConsumerAddress(consumer);

    return getBalanceP(consumerId);
}

async function topUpPromptP() {
    function promptActiveConsumerAndValue(consumers) {
        const question = [
            {
                type: 'list',
                name: 'consumerId',
                message: 'Choose a Consumer',
                choices: sort((a, b) => a.id - b.id)(consumers)
                    .map(consumer => ({
                        name: `${consumer.id} ${consumer.name}`,
                        disabled: consumer.state === CONSUMER_STATES.INACTIVE && 'Inactive'
                    })),
                filter: compose(Number, head, split(' '))
            },
            {
                type: 'input',
                name: 'value',
                message: 'Input your top up value in Wei',
                default: ContractService.configs.CONSUMER_ACTIVATOR_MIN_AMOUNT
            }
        ];

        return prompt(question);
    }

    console.log('---------Top up---------');
    const consumers = await getAllConsumersP();
    const {consumerId, value} = await promptActiveConsumerAndValue(consumers);

    return topUpP(consumerId, value);
}


// Detach Usage:
// obn consumer create -d -n MyConsumer -t BASIC
commander.command('create').description('Create new Consumer with specified configs')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-n, --name <string>', 'Specify Consumer name')
    .option('-t, --tier <string>', 'Specify Consumer tier')
    .action(({detach, name, tier}) => {
        const action = detach
            ? createConsumerP({name, tier})
            : createConsumerPromptP();
        return action.catch(({data}) => logConsoleP('Create Consumer error:\n', data));
    });

commander.command('ls').description('List all consumers')
    .action(function listConsumers() {
        return getAllConsumersP()
            .then(logConsoleP('Consumers:\n'))
            .catch(({data}) => logConsoleP('Get Consumers error:\n', data));
    });

commander.command('describe <id>').description('Describe a consumer')
    .action(function describeConsumer(id) {
        return BPromise.all([getConsumerP(id), getConsumerFileP(id)])
            .then(zipObj(['consumer', 'files']))
            .then(logConsoleP('Consumer:\n'))
            .catch(({data}) => logConsoleP('Get Consumer error:\n', data));
    });

commander.command('activate').description('Activate Consumer')
    .action(function activateConsumer() {
        return createActivationPromptP()
            .then(() => logConsoleP('Your consumer activation has been created, your consumer will be activated after a while', null))
            .catch((error) => logConsoleP('Activate Consumer error:\n', error));
    });

commander.command('upload').description('Upload a file')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-c, --consumer-id <number>', 'Specify Consumer id', Number)
    .option('-p, --file-path <string>', 'Specify path to file')
    .action(({detach, consumerId, filePath}) => {
        const action = detach
            ? uploadP({consumerId, filePath})
            : uploadPromptP();
        return action
            .catch((error) => logConsoleP('Upload file error:\n', error));
    });

commander.command('download').description('Download a file')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-c, --consumer-id <number>', 'Specify Consumer id', Number)
    .option('-f, --file-id <number>', 'Specify File id', Number)
    .option('-p, --download-path <string>', 'Specify path to save the downloaded file')
    .action(({detach, fileId, consumerId, downloadPath}) => {
        const action = detach
            ? downloadP({fileId, consumerId, downloadPath})
            : downloadPromptP();
        return action
            .catch((error) => logConsoleP('Download file error:\n', error));
    });

commander.command('withdraw').description('Withdraw from a Consumer contract')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-c, --consumer-id <number>', 'Specify Consumer id', Number)
    .action(({detach, consumerId}) => {
        const action = detach
            ? withdrawP(consumerId)
            : withdrawPromptP();
        return action
            .catch(({message}) => logConsoleP('Withdraw error:\n', message));
    });

commander.command('deleteFile').description('Delete a file')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-c, --consumer-id <number>', 'Specify Consumer id', Number)
    .option('-f, --file-id <number>', 'Specify File id', Number)
    .action(({detach, fileId, consumerId}) => {
        const action = detach
            ? deleteFileP({consumerId, fileId})
            : deleteFilePromptP();
        return action
            .catch((error) => logConsoleP('Download file error:\n', error));
    });


commander.command('getBalance').description('Get Balance of a consumer')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --consumer-id <number>', 'Specify Consumer id', Number)
    .action(({detach, consumerId}) => {
        const action = detach
            ? getBalanceP(consumerId)
            : getBalancePromptP();
        return action
            .then((balance) => logConsoleP('Your current consumer balance:', balance.toString()))
            .catch(({message}) => logConsoleP('Get Balance error:\n', message));
    });

commander.command('topUp').description('Top up consumer balance in Consumer Contract')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --consumer-id <number>', 'Specify Consumer id', Number)
    .option('-v, --value <number>', 'Specify Value to top up', Number)
    .action(({detach, consumerId, value}) => {
        const action = detach
            ? topUpP(consumerId, value)
            : topUpPromptP();
        return action
            .then(getBalanceInConsumerContractP)
            .then((balance) => logConsoleP('Top up successfully. Your current balance in consumer contract:', balance))
            .catch(({message}) => logConsoleP('Top up error:\n', message));
    });

commander.parse(process.argv);
