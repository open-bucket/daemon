#!/usr/bin/env node

/**
 * Lib imports
 */
const commander = require('commander');


/**
 * Project imports
 */
const ContractServices = require('@open-bucket/contracts');
const {logConsoleP} = require('../utils');

commander.command('accounts').description('List accounts in the wallet')
    .action(function listAccounts() {
        return ContractServices.getAccountsP()
            .then(logConsoleP('Accounts:\n'))
            .catch((error) => logConsoleP('Get Accounts error:\n', error));
    });

commander.parse(process.argv);
