/**
 * Lib imports
 */
const {readFile, readFileSync, writeFile, writeFileSync} = require('fs');
const BPromise = require('bluebird');
const {mergeDeepLeft} = require('ramda');
const {join} = require('path');
const shell = require('shelljs');

/**
 * Project imports
 */
const {createDebugLogger, filterEmptyKeys, constant} = require('./utils');
const {OBN_CONFIGS_PATH, DAEMON_DEFAULT_CONFIG} = require('./constants');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('config-manager');

const writeFileP = BPromise.promisify(writeFile);
const readFileP = BPromise.promisify(readFile);

class ConfigManager {
    constructor() {
        if (!ConfigManager.instance) {
            const rawConfig = this.readDaemonConfigFile();
            this._configs = JSON.parse(rawConfig);
            ConfigManager.instance = this;
        }
        return ConfigManager.instance;
    }

    writeOBNConfigFileP(path, newConfig) {
        const configPath = `${join(OBN_CONFIGS_PATH, path)}.json`;
        const configContent = JSON.stringify(newConfig);
        return writeFileP(configPath, configContent)
            .then(constant(configPath));
    }

    writeConsumerConfigFileP(consumerId, newConfig) {
        return this.writeOBNConfigFileP(`consumer-${consumerId}`, newConfig);
    }

    writeProducerConfigFileP(producerId, newConfig) {
        return this.writeOBNConfigFileP(`producer-${producerId}`, newConfig);
    }

    writeDaemonConfigP(newConfig) {
        const mergedConfigs = mergeDeepLeft(filterEmptyKeys(newConfig), this._configs);
        this._configs = mergedConfigs;
        return this.writeOBNConfigFileP('daemon', mergedConfigs);
    }

    readDaemonConfigFile() {
        const daemonConfigPath = join(OBN_CONFIGS_PATH, 'daemon.json');
        try {
            return readFileSync(daemonConfigPath);
        }
        catch ({message}) {
            console.log('Failed to read Daemon config file: ', message);

            shell.mkdir('-p', OBN_CONFIGS_PATH);
            writeFileSync(daemonConfigPath, JSON.stringify(DAEMON_DEFAULT_CONFIG));
            console.log('Created default Daemon config file at:', daemonConfigPath);
            return JSON.stringify(DAEMON_DEFAULT_CONFIG);
        }
    }

    readOBNConfigFileP(path) {
        const configPath = `${join(OBN_CONFIGS_PATH, path)}.json`;
        return readFileP(configPath).then(JSON.parse);
    }

    readConsumerConfigFileP(consumerId) {
        return this.readOBNConfigFileP(`consumer-${consumerId}`);
    }

    get configs() {
        return this._configs;
    }
}

const ConfigManagerInstance = new ConfigManager();

module.exports = ConfigManagerInstance;
