
const SawChainHandler = require('../../handler')

/**
 * A wrapper class for SawChain Handler.
 * (nb. The wrapper class purpose is to simulate the Sawtooth blockchain in order to speed up tests development).
 */
class SawChainHandlerWrapper {
  constructor () {
    this.handler = new SawChainHandler()
  }

  /**
     * Wrapper method in order to reproduce the apply method.
     * @param {Txn} txn Transaction that is requested to be process.
     * @param {Context} context Object used to write/read in Sawtooth ledger state.
     */
  apply (txn, context) {
    try {
      return this.handler.apply(txn, context)
    } catch (err) {
      return new Promise((resolve, reject) => reject(err))
    }
  }
}

module.exports = SawChainHandlerWrapper
