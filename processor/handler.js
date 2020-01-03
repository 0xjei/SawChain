'use strict'

const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')

const FAMILY_NAME = 'agrichain'
const FAMILY_VERSION = '0.1'
const NAMESPACE = 'bc3a20'

/**
 * Extension of TransactionHandler class for the AgriChain Transaction Processor logic.
 */
class AgriChainHandler extends TransactionHandler {
  /**
   * TransactionHandler constructor registers itself with the
   * validator, declaring which family name, versions, and
   * namespaces it expects to handle.
   */
  constructor () {
    super(FAMILY_NAME, [FAMILY_VERSION], [NAMESPACE])
  }

  /**
   * Smart contract logic core. It'll be called once for every transaction.
   * Validate each action logic and update state according to it.
   * @param {Transaction} txn Transaction process request.
   * @param {Context} context Current state context.
   */
  async apply (txn, context) {
    let payload = null
    // todo
    // Payload decoding.
    // Get action.
    // Action handling.
  }
}

module.exports = AgriChainHandler
