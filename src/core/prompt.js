/**
 * Lib imports
 */
const {prompt} = require('inquirer');
const {curry} = require('ramda');

/**
 * Project imports
 */
const {logConsoleP} = require('../utils');

function _promptHeaderP(header, ...params) {
    return logConsoleP(header, null).then(() => prompt(...params));
}

const promptHeaderP = curry(_promptHeaderP);

module.exports = {
    promptHeaderP
};
