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

function _logT(msg, value) {
    if (value) {
        console.log(msg, value);
    } else {
        console.log(msg);
    }
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
const logT = curry(_logT);


module.exports = {
    constant,
    trace,
    logT,
    delayT
};