'use strict';

const AgriChainHandler = require('../../handler');

// A wrapper class to make testing AgriChain's easier.
class AgriChainHandlerWrapper {
    constructor() {
        this.handler = new AgriChainHandler()
    }

    // This method may throw an error or return a rejected Promise.
    apply(txn, context) {
        try {
            return this.handler.apply(txn, context)
        } catch (err) {
            return new Promise((_, reject) => reject(err))
        }
    }
}

module.exports = AgriChainHandlerWrapper;
