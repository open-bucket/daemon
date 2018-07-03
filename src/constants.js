const {join} = require('path');
const homeDir = require('os').homedir();

module.exports = {
    OBN_PATH: join(homeDir, '.open-bucket'),
    OBN_CONFIGS_PATH: join(homeDir, '.open-bucket', 'configs'),
    OBN_SPACES_PATH: join(homeDir, '.open-bucket', 'spaces'),
    DAEMON_DEFAULT_CONFIG: {
        authToken: '',
        trackerHTTP: 'http://localhost:3000',
        trackerWS: 'ws://localhost:4000'
    }
};
