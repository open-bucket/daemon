const {join} = require('path');
const homeDir = require('os').homedir();

module.exports = {
    OBN_PATH: join(homeDir, '.open-bucket'),
    OBN_CONFIGS_PATH: join(homeDir, '.open-bucket', 'configs'),
    OBN_SPACES_PATH: join(homeDir, '.open-bucket', 'spaces'),
    DAEMON_DEFAULT_CONFIG: {
        authToken: '',
        trackerHTTP: process.env.OBN_TRACKER_HTTP || 'http://localhost:3000',
        trackerWS: process.env.OBN_TRACKER_WS || 'ws://localhost:4000',
        trackerTorrentHTTP: process.env.OBN_TRACKER_TORRENT_HTTP || 'http://localhost:3001/announce',
        torrentClientPort: process.env.OBN_TORRENT_CLIENT_PORT || null,
        partSize: process.env.OBN_PART_SIZE || '10MB'
    }
};
