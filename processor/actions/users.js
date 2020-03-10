'use strict';

const {
    SystemAdmin,
    CompanyAdmin,
    Operator,
    CertificationAuthority,
    ProductType,
    Company
} = require('../services/proto');
const {
    reject,
    calculateHash
} = require('../services/utils');
const {
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getCertificationAuthorityAddress,
    getTaskTypeAddress,
    getProductTypeAddress,
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

    const systemAdminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: System Admin is already recorded.
    if (systemAdminState.publicKey !== '')
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
    const certificationAuthorityAddress = getCertificationAuthorityAddress(publicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress,
        certificationAuthorityAddress
    ]);

    const systemAdminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: System Admin is not recorded.
    if (systemAdminState.publicKey === '')
        reject(`System Admin is not recorded!`);

    // Validation: There is a user already associated to given public key.
    if (systemAdminState.publicKey === publicKey)
        reject(`The public key is associated with the current System Admin!`);

    // Validation: There is a user already associated to given public key.
    if (state[companyAdminAddress].length > 0)
        reject(`There is already a Company Admin with the signer's public key!`);

    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the signer's public key!`);

    // Validation: Given public key is already associated to a CertAuth.
    if (state[certificationAuthorityAddress].length > 0)
        reject(`There is already a Certification Authority with the given public key!`);

    // Validation: Transaction signer is not the System Admin.
    if (systemAdminState.publicKey !== signerPublicKey)
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
async function createOperator(
    context,
    signerPublicKey,
    timestamp,
    {publicKey, task}
) {
    // Validation: Public key is not set.
    if (!publicKey)
        reject(`Public key is not set!`);

    // Validation: Task is not set.
    if (!task)
        reject(`Task is not set!`);

    // Validation: Public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey))
        reject(`Public key field doesn't contain a valid public key!`);

    const systemAdminAddress = getSystemAdminAddress();
    const companyId = calculateHash(signerPublicKey).slice(0, 10)
    const companyAdminAddress = getCompanyAdminAddress(signerPublicKey);
    const companyAddress = getCompanyAddress(companyId);
    const operatorAddress = getOperatorAddress(publicKey);
    const certificationAuthorityAddress = getCertificationAuthorityAddress(publicKey);
    const companyAdminOperatorAddress = getCompanyAdminAddress(publicKey);
    const taskTypeAddress = getTaskTypeAddress(task);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        companyAddress,
        operatorAddress,
        certificationAuthorityAddress,
        companyAdminOperatorAddress,
        taskTypeAddress
    ]);

    const systemAdminState = SystemAdmin.decode(state[systemAdminAddress]);
    const companyAdminState = CompanyAdmin.decode(state[companyAdminAddress]);
    const companyState = Company.decode(state[companyAddress]);

    // Validation: Transaction signer is not a Company Admin or doesn't have a Company associated to his public key.
    if (companyAdminState.publicKey !== signerPublicKey || !state[companyAddress].length)
        reject(`You must be a Company Admin for a Company to create an Operator!`);

    // Validation: There is a user already associated to given public key.
    if (systemAdminState.publicKey === publicKey)
        reject(`The public key is associated with the current System Admin!`);

    if (state[companyAdminOperatorAddress].length > 0)
        reject(`There is already a Company Admin with the given public key!`);

    // Validation: Given public key is already associated to an OP.
    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the given public key!`);

    // Validation: Given public key is already associated to a CertAuth.
    if (state[certificationAuthorityAddress].length > 0)
        reject(`There is already a Certification Authority with the given public key!`);

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

/**
 * Handle a create Certification Authority into the state.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {Object} publicKey The Certification Authority public key.
 * @param {String} name The Certification Authority name.
 * @param {String} website The Certification Authority website.
 * @param {String[]} products The products where the Certification Authority is enabled to issue certificates.
 */
async function createCertificationAuthority(
    context,
    signerPublicKey,
    timestamp,
    {publicKey, name, website, products}
) {
    // Validation: Public key is not set.
    if (!publicKey)
        reject(`Public key is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Website is not set.
    if (!website)
        reject(`Website is not set!`);

    // Validation: Products is not set.
    if (!products.length > 0)
        reject(`Products is not set`);

    // Validation: Public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey))
        reject(`Public key field doesn't contain a valid public key!`);

    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(publicKey);
    const operatorAddress = getOperatorAddress(publicKey);
    const certificationAuthorityAddress = getCertificationAuthorityAddress(publicKey);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress,
        certificationAuthorityAddress
    ]);

    const systemAdminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: System Admin is not recorded.
    if (systemAdminState.publicKey === '')
        reject(`System Admin is not recorded!`);

    // Validation: There is a user already associated to given public key.
    if (systemAdminState.publicKey === publicKey)
        reject(`The public key is associated with the current System Admin!`);

    // Validation: Given public key is already associated to a CA.
    if (state[companyAdminAddress].length0)
        reject(`There is already a Company Admin with the given public key!`);

    // Validation: Given public key is already associated to an OP.
    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the given public key!`);

    // Validation: Given public key is already associated to a CertAuth.
    if (state[certificationAuthorityAddress].length > 0)
        reject(`There is already a Certification Authority with the given public key!`);

    // Validation: Transaction signer is not the System Admin.
    if (systemAdminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: At least one of the provided values for products doesn't match a valid Product Type.
    for (const product of products) {
        let productTypeAddress = getProductTypeAddress(product);

        let state = await context.getState([
            productTypeAddress
        ]);

        if (!state[productTypeAddress].length > 0)
            reject(`The provided Product Type ${product} doesn't match with a valid Product Type!`);
    }

    // State update.
    const updates = {};

    updates[certificationAuthorityAddress] = CertificationAuthority.encode({
        publicKey: publicKey,
        name: name,
        website: website,
        products: products,
        timestamp: timestamp
    }).finish();

    await context.setState(updates);
}

module.exports = {
    createSystemAdmin,
    updateSystemAdmin,
    createOperator,
    createCertificationAuthority
};
