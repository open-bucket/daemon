#!/usr/bin/env node

/**
 * Lib imports
 */
const commander = require('commander');

/**
 * Project imports
 */
const {promptHeaderP} = require('../core/prompt');
const {loginP, registerP} = require('../core/auth');
const {createDebugLogger, logConsoleP} = require('../utils');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('bin:obn');

commander.version('0.0.1');

commander.command('login').description('Login to OBN Tracker')
    .action(function login() {
        const header = '---------Login---------';

        const initQuestions = [{
            type: 'input',
            name: 'username',
            message: 'Username'
        }, {
            type: 'password',
            name: 'password',
            mask: '*',
            message: 'Password'
        }];

        return promptHeaderP(header, initQuestions)
            .then(loginP)
            .then(() => logConsoleP('Login successfully', null))
            .catch(({data}) => logConsoleP('Login error:\n', data));
    });

commander.command('register').description('Register an account on OBN Tracker')
    .action(function login() {
        const header = '---------Register---------';

        const initQuestions = [{
            type: 'input',
            name: 'username',
            message: 'Username'
        }, {
            type: 'password',
            name: 'password',
            mask: '*',
            message: 'Password'
        }];

        return promptHeaderP(header, initQuestions)
            .then(registerP)
            .then(() => logConsoleP('Register successfully', null))
            .catch(({data}) => logConsoleP('Register error:\n', data));
    });

// Register sub-commands
commander
    .command('consumer', 'Consumer functionality')
    .command('producer', 'Producer functionality');

commander.parse(process.argv);

