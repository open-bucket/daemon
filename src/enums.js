const keyMirror = require('keymirror');

const HTTP_METHODS = keyMirror({
    GET: null,
    POST: null
});

const CONSUMER_STATES = keyMirror({
    INACTIVE: null,
    ACTIVE: null
});

const PRODUCER_STATES = keyMirror({
    INACTIVE: null,
    ACTIVE: null
});

const CONSUMER_TIERS = keyMirror({
    BASIC: null,
    PLUS: null,
    PREMIUM: null
});

const WS_TYPE = keyMirror({
    PRODUCER: null,
    CONSUMER: null
});

const WS_ACTIONS = keyMirror({
    PRODUCER_REPORT_SPACE_STATS: null,
    RECOVER_DATA: null,
    CONSUMER_FILE_AVAILABILITY_UPDATED: null,
    CONSUMER_UPLOAD_FILE: null
});

module.exports = {
    HTTP_METHODS,
    CONSUMER_STATES,
    PRODUCER_STATES,
    CONSUMER_TIERS,
    WS_TYPE,
    WS_ACTIONS
};
