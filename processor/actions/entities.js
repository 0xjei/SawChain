'use strict';

const {
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getCompanyAddress
} = require('../services/addressing');
const {
    SystemAdmin,
    CompanyAdmin,
    Company
} = require('../services/proto');
const {
    reject,
    getSHA512
} = require('../services/utils');

async function createCompany(context, signerPublicKey, timestamp, {id, name, description, website, admin}) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Description is not set.
    if (!description)
        reject(`Description is not set!`);

    // Validation: Website is not set.
    if (!website)
        reject(`Website is not set!`);

    // Validation: CA public key field is not set.
    if (!admin)
        reject(`Company Admin public key is not set!`);

    // Validation: CA public key field doesn't contain a valid public key.
    if (!RegExp(`^[0-9A-Fa-f]{66}$`).test(admin))
        reject(`Company Admin public key is invalid!`);

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

    // Validation: Sender is not the SA.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a Company!`);

    // Validation: Company id is not valid.
    if (id !== getSHA512(admin, 10))
        reject(`Given id is not valid!`);

    // Validation: Given public key is associated to current SA.
    if (signerPublicKey === admin)
        reject(`Company Admin public key is equals to System Admin public key!`);

    // Validation: Given public key is already associated to a CA.
    if (state[companyAdminAddress].length > 0)
        reject(`Company Admin public key is already associated to a Company Admin!`);

    // Validation: Given public key is already associated to an OP.
    if (state[operatorAddress].length > 0)
        reject(`Company Admin public key is already associated to an Operator!`);

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

module.exports = {
    createCompany
};