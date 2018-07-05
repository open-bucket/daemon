/**
 * Lib imports
 */
const mkdirP = require('mkdirp-promise');
const {join} = require('path');
const BPromise = require('bluebird');
const bytes = require('bytes');
const {createHash} = require('crypto');

const {stat, readdir, createReadStream, unlink} = require('fs');
const statP = BPromise.promisify(stat);
const readdirP = BPromise.promisify(readdir);
const unlinkP = BPromise.promisify(unlink);

/**
 * Project imports
 */
const {createDebugLogger, constant} = require('./utils');
const {OBN_SPACES_PATH} = require('./constants');
const CM = require('./config-manager');

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

    makeProducerSpaceP({spacePath, producerId}) {
        const path = spacePath || OBN_SPACES_PATH;
        const producerSpacePath = join(path, `producer-${producerId}`);
        return mkdirP(producerSpacePath).then(constant(producerSpacePath));
    }

    async getProducerSpaceStatP(producerId) {
        const {spaceLimit: rawSpaceLimit, space: spacePath} = await CM.readProducerConfigFileP(producerId);
        const actualSize = await this._getDirSizeP(spacePath);
        const spaceLimit = bytes.parse(rawSpaceLimit);

        return {
            availableSpace: spaceLimit - actualSize,
        };
    }

    removeConsumerFileP(consumerId, name) {
        const path = join(OBN_SPACES_PATH, `consumer-${consumerId}`, name);
        return unlinkP(path);
    }

    async removeProducerFileP(producerId, fileName) {
        const {space: spacePath} = await CM.readProducerConfigFileP(producerId);
        const filePath = join(spacePath, fileName);
        return unlinkP(filePath);
    }

    fileToHashP(path) {
        return new BPromise(resolve => {
            const stream = createReadStream(path)
                .pipe(createHash('md5'))
                .on('readable', () => {
                    const data = stream.read();
                    if (data) {
                        resolve(data.toString('hex'));
                    }
                });
        });
    }

    //////////
    // Private
    //////////

    async _getDirSizeP(path) {
        const fileNames = await readdirP(path);
        // assuming this dir don't have recursive structure
        const files = await BPromise.all(fileNames.map(name => statP(join(path, name))));
        return files.reduce((acc, curr) => acc + curr.size, 0);
    }
}

const SpaceManagerInstance = new SpaceManager();

module.exports = SpaceManagerInstance;
