
/**
 * A wrapper class for SawChain Context.
 * (nb. The wrapper class purpose is to simulate the Sawtooth blockchain in order to speed up tests development).
 */
class Context {
  /**
     * The constructor initialize a new empty object which is going to be used as blockchain state.
     */
  constructor () {
    this._state = {}
  }

  /**
     * Retrieve data from the state objects at specific addresses.
     * @param {String[]} addresses A list of target state addresses.
     */
  getState (addresses) {
    return new Promise(resolve => {
      resolve(addresses.reduce((results, addr) => {
        results[addr] = this._state[addr] || []
        return results
      }, {}))
    })
  }

  /**
     * Write data into the state objects at specific addresses.
     * @param {String[]} changes A list of address-update pairs.
     */
  setState (changes) {
    return new Promise(resolve => {
      const addresses = Object.keys(changes)
      addresses.forEach(addr => {
        this._state[addr] = changes[addr]
      })
      resolve(addresses)
    })
  }
}

module.exports = Context
