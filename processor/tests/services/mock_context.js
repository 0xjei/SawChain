'use strict';

/**
 * Wrapper class for current state object Context, used to make TDD development more faster.
 */
class Context {

    // Initialize an empty state.
    constructor() {
        this._state = {};
    }

    /**
     * Retrieve state objects from provided addresses.
     * @param {String[]} addresses List of state addresses.
     */
    getState(addresses) {
        return new Promise(resolve => {
            resolve(addresses.reduce((results, addr) => {
                results[addr] = this._state[addr] || [];
                return results;
            }, {}));
        });
    }

    /**
     * Write state objects into provided addresses.
     * @param {String[]} changes List of new state objects.
     */
    setState(changes) {
        return new Promise(resolve => {
            const addresses = Object.keys(changes);
            addresses.forEach(addr => {
                this._state[addr] = changes[addr];
            });
            resolve(addresses);
        });
    }
}

module.exports = Context;