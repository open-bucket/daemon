// TODO: remove this
/* eslint-disable no-unused-vars */

// NOTICE: files in directory (index.js) only contains logic. Don't put commander or inquiry here

// This var is just only for dev purpose
// REMOVE THIS & re-implement all function use this when we actually implement our Eth wallet
let _wallet;

function isWalletExists() {
    return !!_wallet;
}
// receives config param

// receives seed & password
// connects to Ethereum network
// return the Task Wallet
// this is the async function
function init(seed, password) {
    return 0;
}

// initFromSecretFile derive from init
function initFromSecretFile(path) {
    // find config file
    // find secretPath in config file
    // read the secret
    // if the secret is OK, init from its info
    return 0;
}

module.exports = {
    isWalletExists,
    init,
    initFromSecretFile
};