/**
 * Lib imports
 */
const {readFileSync, writeFile, writeFileSync} = require('fs');
const BPromise = require('bluebird');
const {mergeDeepLeft} = require('ramda');
const {join} = require('path');
const shell = require('shelljs');

/**
 * Project imports
 */
const {createDebugLogger, filterEmptyKeys, constant} = require('./utils');
const {CONFIGS_PATH, DAEMON_DEFAULT_CONFIG} = require('./constants');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('config-manager');

const writeFileP = BPromise.promisify(writeFile);

class ConfigManager {
    constructor() {
        if (!ConfigManager.instance) {
            const rawConfig = this.readDaemonConfigFile();
            this._configs = JSON.parse(rawConfig);
            ConfigManager.instance = this;
        }
        return ConfigManager.instance;
    }

    writeConfigFileP(path, newConfig) {
        const configPath = `${join(CONFIGS_PATH, path)}.json`;
        const configContent = JSON.stringify(newConfig);
        return writeFileP(configPath, configContent)
            .then(constant(configPath));
    }

    writeConsumerConfigFileP(id, newConfig) {
        return this.writeConfigFileP(`consumer-${id}`, newConfig);
    }

    readDaemonConfigFile() {
        const daemonConfigPath = join(CONFIGS_PATH, 'daemon.json');
        try {
            return readFileSync(daemonConfigPath);
        }
        catch ({message}) {
            console.log('Failed to read Daemon config file: ', message);
            
            shell.mkdir('-p', CONFIGS_PATH);
            writeFileSync(daemonConfigPath, JSON.stringify(DAEMON_DEFAULT_CONFIG));
            console.log('Created default Daemon config file at:', daemonConfigPath);
            return JSON.stringify(DAEMON_DEFAULT_CONFIG);
        }
    }

    writeDaemonConfigP(newConfig) {
        const mergedConfigs = mergeDeepLeft(filterEmptyKeys(newConfig), this._configs);
        this._configs = mergedConfigs;
        return this.writeConfigFileP('daemon', mergedConfigs);
    }

    get configs() {
        return this._configs;
    }
}

const ConfigManagerInstance = new ConfigManager();

module.exports = ConfigManagerInstance;
