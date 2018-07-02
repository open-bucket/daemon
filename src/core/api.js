/**
 * Lib imports
 */
const axios = require('axios');
const BPromise = require('bluebird');
const {pick, prop} = require('ramda');

/**
 * Project imports
 */
const CM = require('../config-manager');

function send({url, method = 'GET', headers = {}, token, body}) {
    let configs = {
        baseURL: CM.configs.trackerURL,
        url,
        method,
        data: body,
        headers: {
            Accept: 'application/json',
            ...headers
        }
    };

    if (token) {
        configs.headers.Authorization = `Bearer ${token}`;
    }

    return axios.request(configs)
        .then(prop('data'))
        .catch(({response}) => BPromise.reject(pick(['data', 'status', 'statusText', 'headers'], response)));
}

function post(params) {
    return send({...params, method: 'POST'});
}

function get(params) {
    return send({...params, method: 'GET'});
}

module.exports = {
    post,
    get,
};
