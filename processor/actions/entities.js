'use strict';

const {
    SystemAdmin,
    CompanyAdmin,
    Operator,
    Company,
    Field
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
    getProductTypeAddress,
    getCompanyAddress,
    getFieldAddress
} = require('../services/addressing');

/**
 * Handle a create Company transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Company unique identifier.
 * @param {String} name Company name.
 * @param {String} description Company description.
 * @param {String} website Company website.
 * @param {String} admin Company Admin public key.
 */
async function createCompany(
    context,
    signerPublicKey,
    timestamp,
    {name, description, website, admin}
) {
    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Description is not set.
    if (!description)
        reject(`Description is not set!`);

    // Validation: Website is not set.
    if (!website)
        reject(`Website is not set!`);

    // Validation: Admin public key is not set.
    if (!admin)
        reject(`Admin public key is not set!`);

    // Validation: Admin public key doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(admin))
        reject(`Admin public key doesn't contain a valid public key!`);

    const id = getSHA512(admin, 10);
    const systemAdminAddress = getSystemAdminAddress();
    const companyAdminAddress = getCompanyAdminAddress(admin);
    const operatorAddress = getOperatorAddress(admin);
    const companyAddress = getCompanyAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        companyAdminAddress,
        operatorAddress,
        companyAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: There is already a user with the admin's public key.
    if (signerPublicKey === admin)
        reject(`There is already the System Admin with the signer's public key!`);

    if (state[companyAdminAddress].length > 0)
        reject(`There is already a Company Admin with the signer's public key!`);

    if (state[operatorAddress].length > 0)
        reject(`There is already an Operator with the signer's public key!`);

    // State update.
    const updates = {};

    // Recording Company Admin.
    updates[companyAdminAddress] = CompanyAdmin.encode({
        publicKey: admin,
        company: id,
        timestamp: timestamp
    }).finish();

    // Recording Company.
    updates[companyAddress] = Company.encode({
        id: id,
        name: name,
        description: description,
        website: website,
        timestamp: timestamp,
        adminPublicKey: admin,
        fields: [],
        operators: [],
        batches: []
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a create Field transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Field unique identifier.
 * @param {String} description Field description.
 * @param {String} product Product Type for the cultivable product on the Field.
 * @param {Number} quantity Max predicted production quantity for the Field.
 * @param {Object} location Approximation for the location of the Field.
 */
async function createField(
    context,
    signerPublicKey,
    timestamp,
    {id, description, product, quantity, location}
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Description is not set.
    if (!description)
        reject(`Description is not set!`);

    // Validation: Product is not set.
    if (!product)
        reject(`Product is not set!`);

    // Validation: Location is not set.
    if (!location)
        reject(`Location is not set!`);

    const companyId = getSHA512(signerPublicKey, 10);
    const companyAdminAddress = getCompanyAdminAddress(signerPublicKey);
    const companyAddress = getCompanyAddress(companyId);
    const productAddress = getProductTypeAddress(product);
    const fieldAddress = getFieldAddress(id, companyId);

    const state = await context.getState([
        companyAdminAddress,
        companyAddress,
        productAddress,
        fieldAddress
    ]);

    const companyAdminState = CompanyAdmin.decode(state[companyAdminAddress]);
    const companyState = Company.decode(state[companyAddress]);

    // Validation: Transaction signer is not a Company Admin or doesn't have a Company associated to his public key.
    if (companyAdminState.publicKey !== signerPublicKey || !state[companyAddress].length)
        reject(`You must be a Company Admin for a Company to create a Field!`);

    // Validation: There is already a Field with the provided id into the Company.
    if (state[fieldAddress].length > 0)
        reject(`There is already a Field with the provided id into the Company!`);

    // Validation: The provided Product Type value for product doesn't match a valid Product Type.
    if (!state[productAddress].length)
        reject(`The provided Product Type value for product doesn't match a valid Product Type!`);

    // Validation: Quantity is lower than or equal to zero.
    if (quantity <= 0)
        reject(`Quantity is lower than or equal to zero!`);

    // State update.
    const updates = {};

    // Record field.
    updates[fieldAddress] = Field.encode({
        id: id,
        description: description,
        company: companyId,
        product: product,
        quantity: quantity,
        location: location,
        events: []
    }).finish();

    // Update company.
    companyState.fields.push(id);
    updates[companyAddress] = Company.encode(companyState).finish();

    await context.setState(updates);
}


module.exports = {
    createCompany,
    createField
};