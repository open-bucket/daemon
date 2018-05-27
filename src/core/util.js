/**
 * Lib imports
 */
const {of, task} = require('folktale/concurrency/task');
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

function _traceDebug(namespace, msg, value) {
    trace(debug(namespace), msg, value);
    return value;
}

function _logConsoleT(msg, value) {
    trace(console.log, msg, value);
    return of(value);
}

function delayT(ms) {
    return task(resolver => {
        const timerId = setTimeout(() => resolver.resolve(), ms);
        resolver.cleanup(() => {
            clearTimeout(timerId);
        });
    });
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
const traceDebug = curry(_traceDebug);
const logConsoleT = curry(_logConsoleT);

module.exports = {
    trace,
    traceDebug,
    logConsoleT,
    delayT,
    constant,
    filterEmptyKeys
};
