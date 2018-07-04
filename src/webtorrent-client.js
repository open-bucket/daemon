/**
 * Lib imports
 */
const WebTorrent = require('webtorrent');
const BPromise = require('bluebird');

/**
 * Project imports
 */
const CM = require('./config-manager');

class WebTorrentClient {
    constructor() {
        if (!WebTorrentClient.instance) {
            this._client = null;
            WebTorrentClient.instance = this;
        }
        return WebTorrentClient.instance;
    }

    get client() {
        if (!this._client) {
            this._client = new WebTorrent({dht: false, torrentPort: CM.configs.torrentClientPort});
        }
        return this._client;
    }

    seedP({stream, name}) {
        return new BPromise(resolve => {
            this.client.seed(stream,
                {announce: [CM.configs.trackerTorrentHTTP], name,},
                resolve
            );
        });
    }

    // resolve when download is done
    addP({magnetURI, path}) {
        return new BPromise(resolve => {
            this.client.add(magnetURI, {path}, resolve);
        });
    }

    destroyP() {
        return new BPromise(resolve => {
            this.client.destroy(resolve);
        });
    }

}

const WebTorrentClientInstance = new WebTorrentClient();

module.exports = WebTorrentClientInstance;
