'use strict'

const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')

const { ACPayload } = require('./services/proto')

const { FAMILY_NAME, NAMESPACE } = require('./services/addressing')

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
    super(FAMILY_NAME, ['0.1'], [NAMESPACE])
  }

  /**
   * Smart contract logic core. It'll be called once for every transaction.
   * Validate each action logic and update state according to it.
   * @param {Transaction} txn Transaction process request.
   * @param {Context} context Current state context.
   */
  async apply (txn, context) {
    let payload = null

    // Payload decoding.
    try {
      payload = ACPayload.decode(txn.payload)
    } catch (error) {
      throw new InvalidTransaction(`Failed to decode the payload ${error}`)
    }

    // Get action.
    const action = payload.action

    // Action handling.
    switch (action) {
      case 'CREATE_SYSADMIN':
        console.log('CREATE_SYSADMIN')
        break
      default:
        throw new InvalidTransaction(`Unknown action ${action}`)
    }
  }
}

module.exports = AgriChainHandler
