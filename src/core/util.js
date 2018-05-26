const {of, task} = require('folktale/concurrency/task');
const {curry} = require('ramda');

function constant(v) {
    return function value() {
        return v;
    };
}

function _trace(logFunc, msg, value) {
    if (value) {
        logFunc(msg, value);
    } else {
        logFunc(msg);
    }
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

const trace = curry(_trace);
const logConsoleT = curry(_logConsoleT);


module.exports = {
    trace,
    logConsoleT,
    delayT
};