'use strict';

const {
    getTaskTypeAddress,
    getSystemAdminAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress
} = require('../services/addressing');
const {
    SystemAdmin,
    TaskType,
    ProductType,
    EventParameterType
} = require('../services/proto');
const {reject} = require('../services/utils');

async function createTaskType(context, signerPublicKey, timestamp, {id, role}) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Role is not set.
    if (!role)
        reject(`Role is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const taskTypeAddress = getTaskTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        taskTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Id is not unique for task types.
    if (state[taskTypeAddress].length > 0)
        reject(`Given id is already used in a different task type!`);

    // State update.
    const updates = {};

    updates[getTaskTypeAddress(id)] = TaskType.encode({
        id: id,
        role: role
    }).finish();

    await context.setState(updates)
}

async function createProductType(context, signerPublicKey, timestamp, {id, name, description, measure, derivedProductsType}) {
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

    // Validation: Unit of measure is not equal to one of the enum values.
    if (!Object.values(ProductType.UnitOfMeasure).some((value) => value === measure))
        reject(`Unit of measure is different from one of the possible units values!`);

    const systemAdminAddress = getSystemAdminAddress();
    const productTypeAddress = getProductTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        productTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Id is not unique for product types.
    if (state[productTypeAddress].length > 0)
        reject(`Given id is already used in a different product type!`);

    // Validation: Derived products type are not recorded yet.
    for (const derivedProductId of derivedProductsType) {
        let derivedProductTypeAddress = getProductTypeAddress(derivedProductId);

        let derivedProductState = await context.getState([
            derivedProductTypeAddress
        ]);

        if (!derivedProductState[derivedProductTypeAddress].length) {
            reject(`Given derived Product Type with ${id} id is not recorded yet!`);
        }
    }

    // State update.
    const updates = {};

    updates[getProductTypeAddress(id)] = ProductType.encode({
        id: id,
        name: name,
        description: description,
        measure: measure,
        derivedProductsType: derivedProductsType
    }).finish();

    await context.setState(updates)
}

async function addDerivedProductType(context, signerPublicKey, timestamp, {productTypeId, derivedProductTypeId}) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Product Type id is not set.
    if (!productTypeId)
        reject(`Product Type id is not set!`);

    // Validation: Derived Product Type id is not set.
    if (!derivedProductTypeId)
        reject(`Derived Product Type id is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const productTypeAddress = getProductTypeAddress(productTypeId);
    const derivedProductTypeAddress = getProductTypeAddress(derivedProductTypeId);

    const state = await context.getState([
        systemAdminAddress,
        productTypeAddress,
        derivedProductTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);
    const productState = ProductType.decode(state[productTypeAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Given product does not exist.
    if (!state[productTypeAddress].length > 0)
        reject(`Given Product Type does not exist!`);

    // Validation: Given derived product does not exist.
    if (!state[derivedProductTypeAddress].length > 0)
        reject(`Given derived Product Type does not exist!`);

    // Validation: Given product types cannot be the same.
    if (productTypeId === derivedProductTypeId)
        reject(`Given Product Type is equal to derived Product Type!`);

    // Validation: Given derived product is already used for given product.
    if (productState.derivedProductsType.some(id => id === derivedProductTypeId))
        reject(`Given derived Product Type is already in the list!`);

    // State update.
    const updates = {};

    productState.derivedProductsType.push(derivedProductTypeId);

    updates[getProductTypeAddress(productTypeId)] = ProductType.encode(productState).finish();

    await context.setState(updates)
}

async function createEventParameterType(context, signerPublicKey, timestamp, {id, name, type}) {
    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Event Parameter Type id is not set.
    if (!id)
        reject(`Event Parameter Type id is not set!`);

    // Validation: Event Parameter Type name is not set.
    if (!name)
        reject(`Event Parameter Type name is not set!`);

    // Validation: Type is not equal to one of the enum values.
    if (!Object.values(EventParameterType.Type).some((value) => value === type))
        reject(`Type is different from one of the possible units values!`);

    const systemAdminAddress = getSystemAdminAddress();
    const eventParameterTypeAddress = getEventParameterTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        eventParameterTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Id is not unique for event parameter types.
    if (state[eventParameterTypeAddress].length > 0)
        reject(`Given id is already used in a different event parameter type!`);

    // State update.
    const updates = {};

    updates[eventParameterTypeAddress] = EventParameterType.encode({
        id: id,
        name: name,
        type: type
    }).finish();

    await context.setState(updates)
}

module.exports = {
    createTaskType,
    createProductType,
    addDerivedProductType,
    createEventParameterType
};