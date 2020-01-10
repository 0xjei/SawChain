'use strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {
    FULL_PREFIXES,
    USER_PREFIXES,
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress
} = require('../services/addressing');
const {SystemAdmin} = require('../services/proto');

// A quick convenience function to throw an error with a joined message
const reject = (...msgs) => {
    throw new InvalidTransaction(msgs.join(' '))
};

/**
 * Create a System Admin can bootstrap the system (add company administrators, types, etc.).
 * @param {Context} context - the context the handler can use to access state.
 * @param publicKey
 * @param timestamp
 */
async function createSystemAdmin(context, publicKey, timestamp) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set.`);

    // Validation: SA already recorded.
    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(publicKey);
    const operatorAddress = getOperatorAddress(publicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress
    ]);

    const decodedState = SystemAdmin.decode(state[systemAdminAddress]);

    if (decodedState.publicKey !== '')
        reject(`System Admin is already recorded.`);

    // State update.
    const updates = {};

    updates[systemAdminAddress] = SystemAdmin.encode({
        publicKey: publicKey,
        timestamp: timestamp
    }).finish();

    await context.setState(updates)
}

module.exports = createSystemAdmin;
