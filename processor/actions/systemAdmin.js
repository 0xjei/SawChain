'use strict';

const {
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress
} = require('../services/addressing');
const {SystemAdmin} = require('../services/proto');
const {reject} = require('../services/utils');

/**
 * Create a System Admin who can create types entities for on-chain application configuration.
 * @param {Context} context - the context the handler can use to access state.
 * @param signerPublicKey
 * @param timestamp
 */
async function createSystemAdmin(context, signerPublicKey, timestamp) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    const systemAdminAddress = getSystemAdminAddress();

    const state = await context.getState([
        systemAdminAddress
    ]);

    const decodedState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: SA already recorded.
    if (decodedState.publicKey !== '')
        reject(`System Admin is already recorded!`);

    // State update.
    const updates = {};

    updates[systemAdminAddress] = SystemAdmin.encode({
        publicKey: signerPublicKey,
        timestamp: timestamp
    }).finish();

    await context.setState(updates)
}

/**
 * Update current System Admin of the system with a given public key.
 * @param {Context} context - the context the handler can use to access state.
 * @param signerPublicKey
 * @param timestamp
 * @param newAdminPublicKey
 */
async function updateSystemAdmin(context, signerPublicKey, timestamp, {publicKey}) {
    // Validation: Timestamp not set.
    if (!timestamp || (!timestamp.low && !timestamp.high))
        reject(`Timestamp is not set!`);

    // Validation: Public key field is not set.
    if (!publicKey)
        reject(`New System Admin public key is not set!`);

    // Validation: Public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey))
        reject(`New System Admin public key is invalid!`);

    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(publicKey);
    const operatorAddress = getOperatorAddress(publicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: No SA recorded.
    if (adminState.publicKey === '')
        reject(`No System Admin recorded!`);

    // Validation: The public key belongs to current SA.
    if (adminState.publicKey === publicKey)
        reject(`Signing public key is current System Admin key!`);

    // Validation: Given public key is already associated to a CA.
    if (state[companyAdminAddress].length > 0)
        reject(`New System admin public key is already associated to a Company Admin!`);

    // Validation: Given public key is already associated to an OP.
    if (state[operatorAddress].length > 0)
        reject(`New System admin public key is already associated to an Operator!`);

    // Validation: Signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is different from current System Admin!`);

    // State update.
    const updates = {};

    updates[systemAdminAddress] = SystemAdmin.encode({
        publicKey: publicKey,
        timestamp: timestamp
    }).finish();

    await context.setState(updates)
}

module.exports = {
    createSystemAdmin,
    updateSystemAdmin
};
