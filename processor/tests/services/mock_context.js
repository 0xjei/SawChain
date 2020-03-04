'use strict'

/**
 * Wrapper class for current state object Context in order to make TDD development more faster.
 */
class Context {

    // Initialize an empty state object.
    constructor() {
        this._state = {}
    }

    /**
     * Retrieve state objects data from addresses.
     * @param {String[]} addresses List of state addresses.
     */
    getState(addresses) {
        return new Promise(resolve => {
            resolve(addresses.reduce((results, addr) => {
                results[addr] = this._state[addr] || []
                return results
            }, {}))
        })
    }

    /**
     * Write state objects data into addresses.
     * @param {String[]} changes List of new state objects data.
     */
    setState(changes) {
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