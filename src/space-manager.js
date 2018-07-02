/**
 * Lib imports
 */
const mkdirP = require('mkdirp-promise');
const {join} = require('path');

/**
 * Project imports
 */
const {createDebugLogger, constant} = require('./utils');
const {OBN_SPACES_PATH} = require('./constants');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('space-manager');

class SpaceManager {
    constructor() {
        if (!SpaceManager.instance) {
            SpaceManager.instance = this;
        }
        return SpaceManager.instance;
    }

    makeConsumerSpace(consumerId) {
        const consumerSpaceDirPath = join(OBN_SPACES_PATH, `consumer-${consumerId}`);
        return mkdirP(consumerSpaceDirPath).then(constant(consumerSpaceDirPath));
    }

    makeProducerSpace({spacePath, producerId}) {
        const path = spacePath || OBN_SPACES_PATH;
        const producerSpacePath = join(path, `producer-${producerId}`);
        return mkdirP(producerSpacePath).then(constant(producerSpacePath));
    }
}

const SpaceManagerInstance = new SpaceManager();

module.exports = SpaceManagerInstance;
