/**
 * Lib imports
 */
const BPromise = require('bluebird');
const {writeFile} = require('fs');
const mkdirP = require('mkdirp-promise');
const path = require('path');

/**
 * Project imports
 */
const {logConsoleP} = require('./src/utils');
const {CONFIGS_PATH, DAEMON_DEFAULT_CONFIG} = require('./src/constants');

const DAEMON_CONFIG_PATH = path.join(CONFIGS_PATH, 'daemon.json');

const writeFileP = BPromise.promisify(writeFile);

function writeDefaultDaemonConfig() {
    return writeFileP(DAEMON_CONFIG_PATH, JSON.stringify(DAEMON_DEFAULT_CONFIG));
}

logConsoleP('Writing Daemon default configs to', DAEMON_CONFIG_PATH)
    .then(() => mkdirP(CONFIGS_PATH))
    .then(writeDefaultDaemonConfig)
    .then(() => logConsoleP('Done!', null));
