/**
 * Lib imports
 */
const path = require('path');
const shell = require('shelljs');

/**
 * Project imports
 */
const ContractService = require('@open-bucket/contracts');
const CM = require('./config-manager');
const SM = require('./space-manager');
const api = require('./core/api');
const {connectProducerP} = require('./core/ws');
const {fileToHashP} = require('./core/file');
const {OBN_SPACES_PATH} = require('./constants');
const {createDebugLogger} = require('./utils');
const {WS_ACTIONS} = require('./enums');
const WebTorrentClient = require('./webtorrent-client');

// eslint-disable-next-line no-unused-vars
const log = createDebugLogger('producer');

function getAllProducersP() {
    return api.get({url: '/producers', token: CM.configs.authToken});
}

function getProducerP(id) {
    return api.get({url: `/producers/${id}`, token: CM.configs.authToken});
}

async function createProducerP({spacePath = OBN_SPACES_PATH, spaceLimit = '5 GB', name}) {
    function printNewProducerInfo({space, config}) {
        console.log('Created new producer space at:', space);
        console.log('Created new producer config at:', config);
    }

    const producerInfo = await api.post({
        url: '/producers',
        body: {spacePath, spaceLimit, name},
        token: CM.configs.authToken
    });

    const space = await SM.makeProducerSpaceP({producerId: producerInfo.id, spacePath});
    const config = await CM.writeProducerConfigFileP(producerInfo.id, {id: producerInfo.id, space, spaceLimit});

    printNewProducerInfo({space, config});

    return producerInfo;
}

function createProducerActivationP({producerId, accountIndex}) {
    return ContractService.createProducerActivationP({producerId, accountIndex});
}

async function startProducerP(producerId, keepAlive = false) {

    async function reportSpaceStatsP() {
        const stats = await SM.getProducerSpaceStatP(producerId);
        return wsClient.sendP(JSON.stringify({
            action: WS_ACTIONS.PRODUCER_REPORT_SPACE_STATS,
            payload: stats
        }));
    }

    async function handleProducerShardOrderP({id: shardId, name, magnetURI, size}) {
        const {availableSpace} = await SM.getProducerSpaceStatP(producerId);

        if (availableSpace > size && !WebTorrentClient.get(magnetURI)) {
            console.log(`Received shard ${shardId} order, downloading it...`);
            const filePath = path.join(space, name);
            await WebTorrentClient.addP(magnetURI, {filePath});
            const hash = await fileToHashP(filePath);
            const message = {
                action: WS_ACTIONS.PRODUCER_SHARD_ORDER_CONFIRM,
                payload: {id: shardId, name, hash, size, magnetURI}
            };
            await wsClient.sendP(JSON.stringify(message));
            return {id: shardId, name, hash, size, magnetURI};
        } else {
            log('Producer space limit is reached, skip PRODUCER_SHARD_ORDER', null);
            console.log(`Received shard ${shardId} order, but the space limit is reached or already serving it, skipping`);
        }
    }

    async function handleProducerShardOrderAccept({id: shardId}) {
        console.log(`Shard ${shardId} order confirmation has been accepted, serving it...`);
    }

    async function handleProducerServeFileDone({consumerContractAddress, shards}) {
        for (let {name} of shards) {
            console.log(`Shard ${name} has been served successfully`);
        }
        console.log(`> Your payment is available at Consumer contract: ${consumerContractAddress}`);
        console.log('> You can use `obn producer withdraw` to withdraw them');
    }

    async function handleProducerShardOrderDeny({id: shardId, name, magnetURI}) {
        console.log(`Shard ${shardId} order confirmation has been denied, cleanup`);

        // Delete the file on producer space
        await SM.removeProducerFileP(producerId, name);
        console.log(`Removed ${name} from Producer space`);

        // Delete shard on torrent
        await WebTorrentClient.removeP(magnetURI);
        console.log('Removed torrent');
    }

    async function handleProducerDeleteShard({id: shardId, name, magnetURI}) {
        console.log(`Shard ${shardId} is no longer need to be served, cleanup`);

        // Delete the file on producer space
        await SM.removeProducerFileP(producerId, name);
        console.log(`Removed ${name} from Producer space`);

        // Delete shard on torrent
        await WebTorrentClient.removeP(magnetURI);
        console.log('Removed torrent');
    }

    function handleMessage(rawMessage) {
        log('Received new message from Tracker', rawMessage);
        const {action, payload} = JSON.parse(rawMessage);
        if (action === WS_ACTIONS.PRODUCER_SHARD_ORDER) {
            handleProducerShardOrderP(payload)
                .then(() => log('Handled PRODUCER_SHARD_ORDER', payload.name))
                .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }

        if (action === WS_ACTIONS.PRODUCER_SHARD_ORDER_ACCEPT) {
            handleProducerShardOrderAccept(payload)
                .then(() => log('Handled PRODUCER_SHARD_ORDER_ACCEPT', payload))
                .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }

        if (action === WS_ACTIONS.PRODUCER_SHARD_ORDER_DENY) {
            handleProducerShardOrderDeny(payload)
                .then(() => log('Handled PRODUCER_SHARD_ORDER_DENY', payload))
                .catch(log('Error occurred while handling PRODUCER_SHARD_ORDER'));
        }

        if (action === WS_ACTIONS.PRODUCER_SERVE_FILE_DONE) {
            handleProducerServeFileDone(payload)
                .then(() => log('Handled PRODUCER_SERVE_FILE_DONE', payload))
                .catch(log('Error occurred while handling PRODUCER_SERVE_FILE_DONE'));
        }

        if (action === WS_ACTIONS.PRODUCER_DELETE_SHARD) {
            handleProducerDeleteShard(payload)
                .then(() => log('Handled PRODUCER_DELETE_SHARD', payload))
                .catch(log('Error occurred while handling PRODUCER_DELETE_SHARD'));
        }
    }

    function handleClose(code) {
        console.log('Connection with Tracker has been closed with code', code);
        if (!keepAlive) WebTorrentClient.destroyP();
    }

    function handleError(error) {
        console.log('wsClient error with error', error);
    }

    console.log(`Starting Producer ${producerId}...`);
    const wsClient = await connectProducerP(producerId);

    const {space} = await CM.readProducerConfigFileP(producerId);
    shell.rm('-rf', space);
    shell.mkdir('-p', space);
    console.log('Cleared producer space');

    wsClient
        .on('message', handleMessage)
        .on('close', handleClose)
        .on('error', handleError);
    console.log('Connected to Tracker server');

    await reportSpaceStatsP();
    console.log('Reported producer space stats');

    console.log(`Producer ${producerId} has been started`);

    return function () {
        const closeTask = new Promise((resolve) => {
            wsClient.once('close', resolve);
        });
        wsClient.close();
        return closeTask;
    };
}

async function withdrawP(producerId, contractAddress) {
    const {address} = await getProducerP(producerId);
    return ContractService.withdrawFromConsumerContract(contractAddress, address);
}

async function getBalanceP(producerId) {
    const {address} = await getProducerP(producerId);
    return ContractService.web3.eth.getBalance(address);
}

module.exports = {
    createProducerP,
    getAllProducersP,
    createProducerActivationP,
    startProducerP,
    withdrawP,
    getBalanceP
};
