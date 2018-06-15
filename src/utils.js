/**
 * Project imports
 */
const BPromise = require('bluebird');

/**
 * Lib imports
 */
const {curry} = require('ramda');
const debug = require('debug');

function _trace(logFunc, msg, value) {
    if (value) {
        logFunc(msg, value);
    } else {
        logFunc(msg);
    }
    return value;
}

function _createDebugLogger(namespace, msg, value) {
    return trace(debug(`obn-daemon:${namespace}`), msg, value);
}

function _logConsoleP(msg, value) {
    return BPromise.resolve(trace(console.log, msg, value));
}

function constant(v) {
    return function value() {
        return v;
    };
}

function filterEmptyKeys(obj) {
    return Object.keys(obj)
        .filter(k => obj[k] !== null && obj[k] !== undefined && obj[k] !== '')
        .reduce((newObj, k) => typeof obj[k] === 'object'
            ? Object.assign(newObj, {[k]: filterEmptyKeys(obj[k])})
            : Object.assign(newObj, {[k]: obj[k]}), {});
}

const trace = curry(_trace);
const createDebugLogger = curry(_createDebugLogger);
const logConsoleP = curry(_logConsoleP);

module.exports = {
    trace,
    createDebugLogger,
    logConsoleP,
    constant,
    filterEmptyKeys
};
