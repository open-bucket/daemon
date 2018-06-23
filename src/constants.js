const {join} = require('path');
const homeDir = require('os').homedir();

module.exports = {
    OBN_PATH: join(homeDir, '.open-bucket'),
    OBN_CONFIGS_PATH: join(homeDir, '.open-bucket', 'configs'),
    OBN_SPACES_PATH: join(homeDir, '.open-bucket', 'spaces'),
    DAEMON_DEFAULT_CONFIG: {
        authToken: '',
        trackerURL: 'http://localhost:3000'
    }
};
