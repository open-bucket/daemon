/**
 * Lib imports
 */
const WebSocket = require('ws');
const BPromise = require('bluebird');

/**
 * Project imports
 */
const CM = require('../config-manager');
const {WS_TYPE} = require('../enums');

// returns Promise(wsClient)
function connectTrackerServerP(metadata) {
    return new BPromise((resolve, reject) => {
        const wsClient = new WebSocket(CM.configs.trackerWS, {
            headers: {
                'Authorization': CM.configs.authToken,
                'ws-metadata': JSON.stringify(metadata)
            }
        });
        wsClient
            .once('open', () => resolve(wsClient))
            .once('error', reject);
    });
}

// returns Promise(wsClient)
function connectProducerP(id) {
    return connectTrackerServerP({type: WS_TYPE.PRODUCER, id});
}

module.exports = {
    connectProducerP
};
