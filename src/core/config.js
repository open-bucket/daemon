/**
 * Lib imports
 */
const {readFile, writeFile} = require('fs');
const {fromNodeback} = require('folktale/concurrency/task');
const {mergeDeepLeft} = require('ramda');

/**
 * Project imports
 */
const {traceDebug, filterEmptyKeys} = require('./util');
// eslint-disable-next-line no-unused-vars
const log = traceDebug('obn-config');

// Backward compatible with Node.js < 10
const readFileT = fromNodeback(readFile);
const writeFileT = fromNodeback(writeFile);

const CONFIG_FILE_PATH = `${__dirname}/config.json`;

function readConfigFileT() {
    return readFileT(CONFIG_FILE_PATH).map(JSON.parse);
}

function _writeConfigFileT(newConfig) {
    return writeFileT(CONFIG_FILE_PATH, JSON.stringify(newConfig));
}

// writeConfigFileT :: ({wallet, consumer, producer}) -> Task
function writeConfigFileT(newConfig) {
    return readConfigFileT()
        .map(mergeDeepLeft(filterEmptyKeys(newConfig)))
        .chain(_writeConfigFileT);
}

module.exports = {
    readConfigFileT,
    writeConfigFileT
};
