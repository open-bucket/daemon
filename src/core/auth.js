/**
 * Project imports
 */
const api = require('./api');
const CM = require('../config-manager');

// IMPORTANT:
// We don't handle errors here since they will not be propagated to CLI or Client.
// CLI or Client needs to handle errors on their own.

function registerP({username, password}) {
    return api.post({url: '/users', body: {username, password}});
}

async function loginP({username, password}) {
    const {token, userInfo} = await api.post({url: '/users/login', body: {username, password}});
    const savedPath = await CM.writeDaemonConfigP({authToken: token});
    console.log('Your auth token is saved at:', savedPath);
    return userInfo;
}

module.exports = {
    loginP,
    registerP,
};
