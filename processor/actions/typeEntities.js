'use strict';

const {
    getTaskTypeAddress,
    getSystemAdminAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress
} = require('../services/addressing');
const {
    SystemAdmin,
    TaskType,
    ProductType,
    EventParameterType,
    EventType
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

async function createEventType(context, signerPublicKey, timestamp, {id, name, description, parameters}) {
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

    const systemAdminAddress = getSystemAdminAddress();
    const eventTypeAddress = getEventTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        eventTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a type!`);

    // Validation: Id is not unique for event parameter types.
    if (state[eventTypeAddress].length > 0)
        reject(`Given id is already used in a different event type!`);

    // Validation: Given parameter is not recorded yet.
    for (const parameter of parameters) {
        let parameterTypeAddress = getEventParameterTypeAddress(parameter.parameterTypeId);

        let parameterTypeState = await context.getState([
            parameterTypeAddress
        ]);

        if (!parameterTypeState[parameterTypeAddress].length) {
            reject(`Given parameter Type with ${parameter.parameterTypeId} id is not recorded yet!`);
        }
    }

    // State update.
    const updates = {};

    updates[eventTypeAddress] = EventType.encode({
        id: id,
        name: name,
        description: description,
        parameters: parameters
    }).finish();

    await context.setState(updates)
}

module.exports = {
    createTaskType,
    createProductType,
    createEventParameterType,
    createEventType
};