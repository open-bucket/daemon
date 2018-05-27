#!/usr/bin/env node
// Usage: obn wallet <command>. Ex: obn wallet config
/**
 * Lib imports
 */
const commander = require('commander');

/**
 * Project imports
 */
const {applyConfigPromptT, applyConfigT} = require('./wallet');

commander.command('config').description('Apply new Wallet Config')
    .option('-d, --detach', 'Disable interactive mode')
    .option('-p, --secret-file-path <string>', 'Specify path to your secret file')
    .action(function applyNewWalletConfig({detach, ...rest}) {
        const applyConfigTask = detach
            ? applyConfigT(rest)
            : applyConfigPromptT();
        return applyConfigTask.run().promise();
    });

commander.parse(process.argv);

module.exports = {
    applyConfigPromptT
};
