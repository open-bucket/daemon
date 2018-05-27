/**
 * Lib imports
 */
const {prompt} = require('inquirer');
const {fromPromised} = require('folktale/concurrency/task');
const {curry} = require('ramda');

/**
 * Project imports
 */
const {logConsoleT} = require('./util');

const promptT = fromPromised(prompt);

function _promptHeaderT(header, ...params) {
    return logConsoleT(header, null).chain(() => promptT(...params));
}

const promptHeaderT = curry(_promptHeaderT);

module.exports = {
    promptT,
    promptHeaderT
};
