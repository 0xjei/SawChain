'use strict';

const {
    SystemAdmin,
    CompanyAdmin,
    Operator,
    Company
} = require('../services/proto');
const {
    reject,
    getSHA512
} = require('../services/utils');
const {
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getTaskTypeAddress,
    getCompanyAddress
} = require('../services/addressing');

/**
 * Record the System Admin into the state.
 * The signerPublicKey in the transaction header is used as the System Admin's public key.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 */
async function createSystemAdmin(context, signerPublicKey, timestamp) {
    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(signerPublicKey);
    const operatorAddress = getOperatorAddress(signerPublicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress
    ]);

    const systemAdmin = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: System Admin is already recorded.
    if (systemAdmin.publicKey !== '')
        reject(`System Admin is already recorded!`);

    // Validation: There is already a user with the signer's public key.
    if (state[companyAdminAddress].length > 0)
        reject(`There is already a Company Admin with the signer's public key!`);

    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the signer's public key!`);

    // State update.
    const updates = {};

    updates[systemAdminAddress] = SystemAdmin.encode({
        publicKey: signerPublicKey,
        timestamp: timestamp
    }).finish();

    await context.setState(updates)
}

/**
 * Update the public key recorded into the System Admin unique state address.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} publicKey The new System Admin public key.
 */
async function updateSystemAdmin(context, signerPublicKey, timestamp, {publicKey}) {
    // Validation: Public key field is not set.
    if (!publicKey)
        reject(`Public key field is not set!`);

    // Validation: Public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey))
        reject(`Public key field doesn't contain a valid public key!`);

    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(publicKey);
    const operatorAddress = getOperatorAddress(publicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress
    ]);

    const systemAdmin = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: System Admin is not recorded.
    if (systemAdmin.publicKey === '')
        reject(`System Admin is not recorded!`);

    // Validation: There is a user already associated to given public key.
    if (systemAdmin.publicKey === publicKey)
        reject(`The public key is associated with the current System Admin!`);

    // Validation: There is a user already associated to given public key.
    if (state[companyAdminAddress].length > 0)
        reject(`There is already a Company Admin with the signer's public key!`);

    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the signer's public key!`);

    // Validation: Transaction signer is not the System Admin.
    if (systemAdmin.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // State update.
    const updates = {};

    updates[systemAdminAddress] = SystemAdmin.encode({
        publicKey: publicKey,
        timestamp: timestamp
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a create Operator transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} publicKey Operator public key.
 * @param {String} task Task Type identifier for Operator task.
 */
async function createOperator(context, signerPublicKey, timestamp, {publicKey, task}) {
    // Validation: Public key is not set.
    if (!publicKey)
        reject(`Public key is not set!`);

    // Validation: Task is not set.
    if (!task)
        reject(`Task is not set!`);

    // Validation: Public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey))
        reject(`Public key doesn't contain a valid public key!`);

    const companyId = getSHA512(signerPublicKey, 10);
    const companyAdminAddress = getCompanyAdminAddress(signerPublicKey);
    const companyAddress = getCompanyAddress(companyId);
    const operatorAddress = getOperatorAddress(publicKey);
    const companyAdminOperatorAddress = getCompanyAdminAddress(publicKey);
    const taskTypeAddress = getTaskTypeAddress(task);

    const state = await context.getState([
        companyAdminAddress,
        companyAddress,
        operatorAddress,
        companyAdminOperatorAddress,
        taskTypeAddress
    ]);

    const companyAdminState = CompanyAdmin.decode(state[companyAdminAddress]);
    const companyState = Company.decode(state[companyAddress]);

    // Validation: Transaction signer is not a Company Admin or doesn't have a Company associated to his public key.
    if (companyAdminState.publicKey !== signerPublicKey || !state[companyAddress].length)
        reject(`You must be a Company Admin for a Company to create an Operator!`);

    // Validation: There is already a user with the operator's public key.
    if (state[companyAdminOperatorAddress].length > 0)
        reject(`There is already a Company Admin with the signer's public key!`);

    // Validation: Given public key is already associated to an OP.
    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the signer's public key!`);

    // Validation: The provided Task Type value for task doesn't match a valid Task Type.
    if (!state[taskTypeAddress].length)
        reject(`The provided Task Type value for task doesn't match a valid Task Type!`);

    // State update.
    const updates = {};

    updates[operatorAddress] = Operator.encode({
        publicKey: publicKey,
        company: companyId,
        task: task,
        timestamp: timestamp
    }).finish();

    // Update company.
    companyState.operators.push(publicKey);
    updates[companyAddress] = Company.encode(companyState).finish();

    await context.setState(updates);
}

module.exports = {
    createSystemAdmin,
    updateSystemAdmin,
    createOperator
};
