/**
 * Lib imports
 */
const WebTorrent = require('webtorrent');
const BPromise = require('bluebird');
const {createWriteStream} = require('fs');

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

    addP(magnetURI, {filePath}) {
        return new BPromise(resolve => {
            this.client.add(magnetURI, (torrent) => {
                torrent
                    .files[0] // each shard torrent only contains 1 file
                    .createReadStream()
                    .pipe(createWriteStream(filePath))
                    .once('finish', () => resolve(filePath));
            });
        });
    }

    get(magnetURI) {
        return this.client.get(magnetURI);
    }

    removeP(magnetURI) {
        return new BPromise(resolve => {
            this.client.remove(magnetURI, resolve);
        });
    }

    destroyP() {
        if (this._client) {
            return new BPromise(resolve => {
                this._client.destroy(()=>{                    
                    this._client = null;
                    resolve();
                });
            });
        }
    }

}

const WebTorrentClientInstance = new WebTorrentClient();

module.exports = WebTorrentClientInstance;
