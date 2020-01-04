'use strict'

const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')

const protobuf = require('protobufjs')
const protoJson = require('./utils/protoRoot.json')

const FAMILY_NAME = 'AgriChain'
const FAMILY_VERSION = '0.1'
const NAMESPACE = 'f4cb6d'

// Payload message protobuf.
const root = protobuf.Root.fromJSON(protoJson)
const PayloadMessage = root.lookup('ACPayload')

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

    // Payload decoding.
    try {
      payload = PayloadMessage.decode(txn.payload)
    } catch (error) {
      throw new InvalidTransaction(`Failed to decode the payload ${error}`)
    }

    // Get action.
    const action = payload.action

    // Action handling.
    switch (action) {
      case 'FIRST_ACTION':
        console.log('First Action')
        break
      default:
        throw new InvalidTransaction(`Unknown action ${action}`)
    }
  }
}

module.exports = AgriChainHandler
