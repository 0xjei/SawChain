'use strict';

const {
    SystemAdmin,
    CompanyAdmin,
    Operator,
    EventParameterType,
    EventType,
    Company,
    Field,
    Batch,
    Event
} = require('../services/proto');
const {
    reject,
    getSHA512
} = require('../services/utils');
const {
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress,
    getProductTypeAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress
} = require('../services/addressing');

/**
 * Check if a value for a parameter is valid.
 * @param {Object} parameter EventParameterType pre-defined object.
 * @param {Object} parameterValue ParameterValue object provided by the Operator.
 * @param {Object} parameterType EventParameterType information type (Number, String or Bytes).
 */
const checkParameterValue = (parameter, parameterValue, parameterType) => {
    switch (parameterType) {
        // Number Event Parameter Type.
        case EventParameterType.Type.NUMBER:
            // Validation: No correct value field is provided for required parameter of type number.
            if (parameter.required && parameterValue.floatValue === 0.0)
                reject(`No correct value field is provided for ${parameter.parameterTypeId} required parameter of type number!`);

            // Validation: The provided number is lower than the minimum value constraint.
            if (parameterValue.floatValue !== 0.0 && parameterValue.floatValue < parameter.minValue)
                reject(`Provided value ${parameterValue.floatValue} is lower than the minimum value constraint ${parameter.minValue}!`);

            // Validation: The provided number is greater than the maximum value constraint.
            if (parameterValue.floatValue !== 0.0 && parameterValue.floatValue > parameter.maxValue)
                reject(`Provided value ${parameterValue.floatValue} is greater than the maximum value constraint ${parameter.maxValue}!`);

            break;

        // String Event Parameter Type.
        case EventParameterType.Type.STRING:
            // Validation: No correct value field is provided for required parameter of type string.
            if (parameter.required && parameterValue.stringValue === "")
                reject(`No correct value field is provided for ${parameter.parameterTypeId} required parameter of type string!`);

            // Validation: The provided string length is lower than the minimum length constraint.
            if (parameterValue.stringValue !== "" && parameterValue.stringValue.length < parameter.minLength)
                reject(`Provided value length ${parameterValue.stringValue.length} is lower than the minimum length constraint ${parameter.minLength}!`);

            // Validation: The provided string length is greater than the maximum length constraint.
            if (parameterValue.stringValue !== "" && parameterValue.stringValue.length > parameter.maxLength)
                reject(`Provided value length ${parameterValue.stringValue.length} is greater than the maximum length constraint ${parameter.maxLength}!`);

            break;

        // Bytes Event Parameter Type.
        case EventParameterType.Type.BYTES:
            // Validation: No correct value field is provided for required parameter of type bytes.
            if (parameter.required && !parameterValue.bytesValue.length > 0)
                reject(`No correct value field is provided for ${parameter.parameterTypeId} required parameter of type bytes!`);

            break;
    }
};

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

/**
 * Handle a Create Description Event transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} eventTypeId EventType unique identifier.
 * @param {Object[]} values Unique identifiers and values of different EventParameterValues.
 * @param {String} batch Input batch where Event will be recorded.
 * @param {String} field Input field where Event will be recorded.
 */
async function createDescriptionEvent(
    context,
    signerPublicKey,
    timestamp,
    {eventTypeId, values, batch, field}
) {
    // Validation: Event Type id is not set.
    if (!eventTypeId)
        reject(`Event Type id is not set!`);

    // Validation: Batch or Field is not set.
    if ((!batch && !field) || (batch && field))
        reject(`You must set a Batch or a Field where you\'re going to record the event!`);

    const operatorAddress = getOperatorAddress(signerPublicKey);

    let state = await context.getState([
        operatorAddress
    ]);

    const operatorState = Operator.decode(state[operatorAddress]);

    // Validation: Transaction signer is not an Operator for a Company.
    if (!state[operatorAddress].length)
        reject(`You must be an Operator for a Company!`);

    const companyAddress = getCompanyAddress(operatorState.company);
    const eventTypeAddress = getEventTypeAddress(eventTypeId);
    const fieldAddress = getFieldAddress(field, operatorState.company);
    const batchAddress = getBatchAddress(batch, operatorState.company);

    state = await context.getState([
        operatorAddress,
        companyAddress,
        eventTypeAddress,
        fieldAddress,
        batchAddress
    ]);

    const companyState = Company.decode(state[companyAddress]);
    const eventTypeState = EventType.decode(state[eventTypeAddress]);
    const fieldState = Field.decode(state[fieldAddress]);
    const batchState = Batch.decode(state[batchAddress]);

    // Validation: Provided value for field does not match with a Company Field.
    if(field && !(companyState.fields.indexOf(field) > -1))
        reject(`The provided field ${field} is not a Company Field!`);

    // Validation: Provided value for batch does not match with a Company Batch.
    if(batch && !(companyState.batches.indexOf(batch) > -1))
        reject(`The provided batch ${batch} is not a Company Batch!`);

    // Validation: Provided value for eventTypeId does not match with a valid Event Type.
    if (!state[eventTypeAddress].length)
        reject(`The provided Event Type ${eventTypeId} doesn't match a valid Event Type!`);

    // Validation: Provided Event Type doesn't match a valid description Event Type.
    if (eventTypeState.typology !== 0)
        reject(`The provided Event Type ${eventTypeId} is not a description event!`);

    // Validation: Operator's task doesn't match one of the enabled Task Types for the Event Type.
    if (!(eventTypeState.enabledTaskTypes.indexOf(operatorState.task) > -1))
        reject(`You cannot record this Event with a ${operatorState.task} task!`);

    // Validation: Field Product Type doesn't match one of the enabled Product Types for the Event Type.
    if (field && eventTypeState.enabledProductTypes.indexOf(fieldState.product) === -1)
        reject(`You cannot record this Event on ${field} Field!`);

    // Validation: Batch Product Type doesn't match one of the enabled Product Types for the Event Type.
    if (batch && eventTypeState.enabledProductTypes.indexOf(batchState.product) === -1)
        reject(`You cannot record this Event on ${field} Batch!`);

    // Validation: No values are provided for required Event Parameters.
    if (!values.length > 0 && eventTypeState.parameters.some(param => param.required === true))
        reject(`You must provide values for each required Event Parameter!`);

    // Validation: Check if each provided ParameterValue for EventParameters is valid.
    for (const param of eventTypeState.parameters) {
        let paramAddress = getEventParameterTypeAddress(param.parameterTypeId);

        let state = await context.getState([
            paramAddress
        ]);

        const parameterTypeState = EventParameterType.decode(state[paramAddress]);

        for (const paramValue of values) {
            // Check if a value is provided for a parameter.
            if (param.parameterTypeId === paramValue.parameterTypeId)
                // ParameterValue validation.
                checkParameterValue(param, paramValue, parameterTypeState.type)
        }
    }

    // State update.
    const updates = {};

    // Create an Event.
    const event = Event.create({
        eventTypeId: eventTypeId,
        reporter: signerPublicKey,
        values: values,
        timestamp: timestamp
    });

    // Record Event on Field.
    if (field) {
        fieldState.events.push(event);
        updates[fieldAddress] = Field.encode(fieldState).finish();
    }

    // Record Event on Batch.
    if (batch) {
        batchState.events.push(event);
        updates[batchAddress] = Batch.encode(batchState).finish();
    }

    await context.setState(updates);
}

module.exports = {
    createCompany,
    createField,
    createDescriptionEvent
};