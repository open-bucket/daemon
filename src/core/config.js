/**
 * Lib imports
 */
const {readFile} = require('fs');
const {fromNodeback} = require('folktale/concurrency/task');

// Backward compatible with Node.js < 10
const readFileT = fromNodeback(readFile);

const CONFIG_FILE_PATH = `${__dirname}/config.json`;

function readConfigFileT() {
    return readFileT(CONFIG_FILE_PATH).map(JSON.parse);
}

module.exports = {
    readConfigFileT
};
