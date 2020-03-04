'use strict'

const SawChainHandler = require('../../handler')

/**
 * Wrapper class for SawChain Handler in order to make TDD development more faster.
 */
class SawChainHandlerWrapper {

    constructor() {
        this.handler = new SawChainHandler()
    }

    // Apply wrapper.
    apply(txn, context) {
        try {
            return this.handler.apply(txn, context)
        } catch (err) {
            return new Promise((_, reject) => reject(err))
        }
    }
}

module.exports = SawChainHandlerWrapper
