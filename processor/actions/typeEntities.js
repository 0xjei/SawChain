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

    // Validation: Sender is not the SA.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a Task Type!`);

    // Validation: Given id is already associated to a task type.
    if (state[taskTypeAddress].length > 0)
        reject(`Given id is already associated to a Task Type!`);

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
        reject(`Unit of measure is different from one of the possible values!`);

    const systemAdminAddress = getSystemAdminAddress();
    const productTypeAddress = getProductTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        productTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Sender is not the SA.
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

    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

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

async function createEventType(
    context,
    signerPublicKey,
    timestamp,
    {id, typology, name, description, parameters, enabledTaskTypes, enabledProductTypes, derivedProductTypes}
) {

    // Validation: Timestamp not set.
    if (!timestamp.low && !timestamp.high)
        reject(`Timestamp is not set!`);

    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Typology is not equal to one of the enum values.
    if (!Object.values(EventType.EventTypology).some((value) => value === typology))
        reject(`Typology is different from one of the possible values!`);

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

    // Validation: At least one parameter is not recorded yet.
    for (const parameter of parameters) {
        let parameterTypeAddress = getEventParameterTypeAddress(parameter.parameterTypeId);

        let parameterTypeState = await context.getState([
            parameterTypeAddress
        ]);

        if (!parameterTypeState[parameterTypeAddress].length) {
            reject(`Given parameter Type with ${parameter.parameterTypeId} id is not recorded yet!`);
        }
    }

    // Validation: At least one enabled task type is not recorded yet.
    for (const taskTypeId of enabledTaskTypes) {
        let taskTypeAddress = getTaskTypeAddress(taskTypeId);

        let taskTypeState = await context.getState([
            taskTypeAddress
        ]);

        if (!taskTypeState[taskTypeAddress].length) {
            reject(`Given Task Type with ${taskTypeId} id is not recorded yet!`);
        }
    }

    // Validation: At least one enabled product type is not recorded yet.
    for (const productTypeId of enabledProductTypes) {
        let productTypeAddress = getProductTypeAddress(productTypeId);

        let productTypeState = await context.getState([
            productTypeAddress
        ]);

        if (!productTypeState[productTypeAddress].length) {
            reject(`Given enabled Product Type with ${productTypeId} id is not recorded yet!`);
        }
    }

    // Validation: No derived products for transformation event.
    if (typology === EventType.EventTypology.TRANSFORMATION && !derivedProductTypes.length)
        reject(`No derived Product Type given for transformation event!`);

    // Validation: Given derived products for not transformation event.
    if (typology !== EventType.EventTypology.TRANSFORMATION && derivedProductTypes.length > 0)
        reject(`Derived Product Type must be empty for non transformation event!`);

    // Validation: At least one derived product type is not recorded yet.
    for (const productTypeId of derivedProductTypes) {
        let productTypeAddress = getProductTypeAddress(productTypeId);

        let productTypeState = await context.getState([
            productTypeAddress
        ]);

        if (!productTypeState[productTypeAddress].length) {
            reject(`Given derived Product Type with ${productTypeId} id is not recorded yet!`);
        }
    }

    // State update.
    const updates = {};

    updates[eventTypeAddress] = EventType.encode({
        id: id,
        typology: typology,
        name: name,
        description: description,
        parameters: parameters,
        enabledTaskTypes: enabledTaskTypes,
        enabledProductTypes: enabledProductTypes,
        derivedProductTypes: derivedProductTypes
    }).finish();

    await context.setState(updates)
}

module.exports = {
    createTaskType,
    createProductType,
    createEventParameterType,
    createEventType
};