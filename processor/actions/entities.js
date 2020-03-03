'use strict';

const {
    SystemAdmin,
    CompanyAdmin,
    Operator,
    CertificationAuthority,
    ProductType,
    EventParameterType,
    EventType,
    PropertyType,
    Company,
    Field,
    Batch,
    Event,
    TypeData
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
    getPropertyTypeAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress,
    getCertificationAuthorityAddress
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
        case TypeData.Type.NUMBER:
            // Validation: The provided number is lower than the minimum value constraint.
            if (parameterValue.floatValue !== 0.0 && parameterValue.floatValue < parameter.minValue)
                reject(`Provided value ${parameterValue.floatValue} is lower than the minimum value constraint ${parameter.minValue}!`);

            // Validation: The provided number is greater than the maximum value constraint.
            if (parameterValue.floatValue !== 0.0 && parameterValue.floatValue > parameter.maxValue)
                reject(`Provided value ${parameterValue.floatValue} is greater than the maximum value constraint ${parameter.maxValue}!`);

            break;

        // String Event Parameter Type.
        case TypeData.Type.STRING:
            // Validation: The provided string length is lower than the minimum length constraint.
            if (parameterValue.stringValue !== "" && parameterValue.stringValue.length < parameter.minLength)
                reject(`Provided value length ${parameterValue.stringValue.length} is lower than the minimum length constraint ${parameter.minLength}!`);

            // Validation: The provided string length is greater than the maximum length constraint.
            if (parameterValue.stringValue !== "" && parameterValue.stringValue.length > parameter.maxLength)
                reject(`Provided value length ${parameterValue.stringValue.length} is greater than the maximum length constraint ${parameter.maxLength}!`);

            break;
    }
};

/**
 * Check if a value for a property is valid.
 * @param {Object} value PropertyValue object provided by the Operator.
 * @param {Object} type PropertyType type (Temperature, Location).
 */
const checkField = (value, type) => {
    switch (type) {
        // Number Property.
        case TypeData.Type.NUMBER:
            // Validation: No correct value field is provided for temperature type property.
            if (value.floatValue === 0.0)
                reject(`No correct value field is provided for property of type ${type}!`);

            break;

        // String Property.
        case TypeData.Type.STRING:
            // Validation: No correct value field is provided for location type property.
            if (value.stringValue.length === 0)
                reject(`No correct value field is provided for property of type ${type}!`);

            break;

        // String Property.
        case TypeData.Type.BYTES:
            // Validation: No correct value field is provided for location type property.
            if (!value.bytesValue.length > 0)
                reject(`No correct value field is provided for property of type ${type}!`);

            break;

        // String Property.
        case TypeData.Type.LOCATION:
            // Validation: No correct value field is provided for location type property.
            if (!value.locationValue)
                reject(`No correct value field is provided for property of type ${type}!`);

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
 * @param {String} batch Input batch where Event will be recorded.
 * @param {String} field Input field where Event will be recorded.
 * @param {Object[]} values Unique identifiers and values of different EventParameterValues.
 */
async function createDescriptionEvent(
    context,
    signerPublicKey,
    timestamp,
    {eventTypeId, batch, field, values}
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
    if (field && companyState.fields.indexOf(field) === -1)
        reject(`The provided field ${field} is not a Company Field!`);

    // Validation: Provided value for batch does not match with a Company Batch.
    if (batch && companyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`);

    // Validation: Provided value for eventTypeId does not match with a valid Event Type.
    if (!state[eventTypeAddress])
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
            if (param.parameterTypeId === paramValue.parameterTypeId) {
                if (param.required)
                    checkField(paramValue, parameterTypeState.type);

                // ParameterValue validation.
                checkParameterValue(param, paramValue, parameterTypeState.type);
            }
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

/**
 * Handle a Create Transformation Event transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} eventTypeId EventType unique identifier.
 * @param {String[]} batches Input batches to transform.
 * @param {String[]} fields Input fields to transform.
 * @param {float[]} quantities Input quantities to subtract from fields or batches.
 * @param {String} derivedProduct Output Product Type for the output Batch.
 * @param {String} outputBatchId Output Batch identifier.
 */

async function createTransformationEvent(
    context,
    signerPublicKey,
    timestamp,
    {eventTypeId, batches, fields, quantities, derivedProduct, outputBatchId}
) {
    // Validation: Event Type id is not set.
    if (!eventTypeId)
        reject(`Event Type id is not set!`);

    // Validation: A list of Batch or a list of Field is not set.
    if ((!batches.length > 0 && !fields.length > 0) || (batches.length > 0 && fields.length > 0))
        reject(`You must set a list of Batch or a list of Field to transform!`);

    // Validation: A list of quantities not set.
    if (!quantities.length > 0)
        reject(`Quantities list is not set!`);

    // Validation: Derived product is not set.
    if (!derivedProduct)
        reject(`Derived product is not set!`);

    // Validation: Output Batch identifier is not set.
    if (!outputBatchId)
        reject(`Output Batch identifier is not set!`);

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
    const outputBatchAddress = getBatchAddress(outputBatchId, operatorState.company);

    state = await context.getState([
        companyAddress,
        eventTypeAddress,
        outputBatchAddress
    ]);

    const companyState = Company.decode(state[companyAddress]);
    const eventTypeState = EventType.decode(state[eventTypeAddress]);

    // Validation: Provided value for eventTypeId does not match with a valid Event Type.
    if (!state[eventTypeAddress])
        reject(`The provided Event Type ${eventTypeId} doesn't match a valid Event Type!`);

    const fieldsState = [];
    const batchesState = [];

    // Validation: At least one of the provided values for fields doesn't match a Company Field.
    for (const field of fields) {
        // Validation: Provided value for field does not match with a Company Field.
        if (companyState.fields.indexOf(field) === -1)
            reject(`The provided field ${field} is not a Company Field!`);

        // Fields decoding.
        const companyFieldAddress = getFieldAddress(field, operatorState.company);

        state = await context.getState([
            companyFieldAddress
        ]);

        fieldsState.push(Field.decode(state[companyFieldAddress]));
    }

    // Validation: At least one of the provided values for batches doesn't match a Company Batch.
    for (const batch of batches) {
        // Validation: Provided value for batch does not match with a Company Batch.
        if (companyState.batches.indexOf(batch) === -1)
            reject(`The provided batch ${batch} is not a Company Batch!`);

        // Batches decoding.
        const companyBatchAddress = getBatchAddress(batch, operatorState.company);

        state = await context.getState([
            companyBatchAddress
        ]);

        batchesState.push(Batch.decode(state[companyBatchAddress]));
    }

    // Validation: Provided Event Type doesn't match a valid transformation Event Type.
    if (eventTypeState.typology !== 1)
        reject(`The provided Event Type ${eventTypeId} is not a transformation event!`);

    // Validation: Operator's task doesn't match one of the enabled Task Types for the Event Type.
    if (!(eventTypeState.enabledTaskTypes.indexOf(operatorState.task) > -1))
        reject(`You cannot record this Event with a ${operatorState.task} task!`);

    // Validation: At least a provided field doesn't match other Field's Product Type.
    if (fieldsState.length > 0 && fieldsState.some(field => field.product !== fieldsState[fieldsState.length - 1].product))
        reject(`You cannot transform fields with different products!`);

    // Validation: At least a provided batch doesn't match other Batch's Product Type.
    if (batchesState.length > 0 && batchesState.some(batch => batch.product !== batchesState[batchesState.length - 1].product))
        reject(`You cannot transform batches with different products!`);

    // Validation: Field Product Type doesn't match one of the enabled Product Types for the Event Type.
    if (fieldsState.length > 0 && eventTypeState.enabledProductTypes.indexOf(fieldsState[fieldsState.length - 1].product) === -1)
        reject(`You cannot record this Event on fields with product ${fieldsState[fieldsState.length - 1].product}!`);

    // Validation: Batch Product Type doesn't match one of the enabled Product Types for the Event Type.
    if (batchesState.length > 0 && eventTypeState.enabledProductTypes.indexOf(batchesState[batchesState.length - 1].product) === -1)
        reject(`You cannot record this Event on batches with product ${batchesState[batchesState.length - 1].product}!`);

    // Validation: Derived product doesn't match one of the derived Product Types for the Event Type.
    if (!(eventTypeState.derivedProductTypes.indexOf(derivedProduct) > -1))
        reject(`You cannot transform with ${eventTypeId} event in order to create a Batch with ${derivedProduct} product!`);

    /// Validation: At least one of the given quantities is less or equal to zero.
    if (quantities.some(quantity => quantity <= 0))
        reject(`At least one of the given quantities is less or equal to zero!`);

    // Validation: The quantity to be subtracted cannot be greater than the current quantity of the Batch or Field.
    quantities.forEach((quantity, index) => {
        // Validation: Provided quantity greater than field quantity.
        if (fieldsState.length > 0 && fieldsState[index].quantity - quantity < 0)
            reject(`The provided quantity ${quantity} cannot be greater than the current ${fieldsState[index].id} Field quantity ${fieldsState[index].quantity}`);

        // Validation: Provided quantity greater than batch quantity.
        if (batchesState.length > 0 && batchesState[index].quantity - quantity < 0)
            reject(`The provided quantity ${quantity} cannot be greater than the current ${batchesState[index].id} Batch quantity ${batchesState[index].quantity}`);
    });

    /// Validation: The provided output batch identifier is already used for another Company Batch.
    if (companyState.batches.some(batch => batch === outputBatchId))
        reject(`The provided output batch identifier ${outputBatchId} is already used for another Company Batch`);

    // Retrieve conversion rate for derived product from Batch or Field product.
    let productTypeAddress;
    let inputProduct;

    if (fields.length > 0) {
        inputProduct = fieldsState[fieldsState.length - 1].product;
        productTypeAddress = getProductTypeAddress(inputProduct);
    } else {
        inputProduct = batchesState[batchesState.length - 1].product;
        productTypeAddress = getProductTypeAddress(inputProduct);
    }

    state = await context.getState([
        productTypeAddress
    ]);

    const conversionRate = ProductType.decode(state[productTypeAddress])
        .derivedProducts.filter(
            drvPrd => drvPrd.derivedProductType === derivedProduct
        )[0].conversionRate;

    // State update.
    const updates = {};

    // Record Event on each input Field.
    if (fields.length > 0) {
        for (let i = 0; i < fieldsState.length; i++) {
            const fieldAddress = getFieldAddress(fieldsState[i].id, operatorState.company);

            fieldsState[i].events.push(Event.create({
                eventTypeId: eventTypeId,
                reporter: signerPublicKey,
                values: [],
                quantity: quantities[i],
                timestamp: timestamp
            }));

            fieldsState[i].quantity -= quantities[i];
            updates[fieldAddress] = Field.encode(fieldsState[i]).finish();
        }
    }

    // Record Event on each input Batch.
    if (batches.length > 0) {
        for (let i = 0; i < batchesState.length; i++) {
            const batchAddress = getBatchAddress(batchesState[i].id, operatorState.company);

            batchesState[i].events.push(Event.create({
                eventTypeId: eventTypeId,
                reporter: signerPublicKey,
                values: [],
                quantity: quantities[i],
                timestamp: timestamp
            }));

            batchesState[i].quantity -= quantities[i];
            updates[batchAddress] = Batch.encode(batchesState[i]).finish();
        }
    }

    // Create output Batch.
    updates[outputBatchAddress] = Batch.encode({
        id: outputBatchId,
        company: operatorState.company,
        product: derivedProduct,
        quantity: quantities.reduce((tot, sum) => {
            return tot + sum
        }) * conversionRate,
        parentFields: fields,
        parentBatches: batches,
        events: [],
        certificates: [],
        properties: [],
        finalized: false,
        timestamp: timestamp
    }).finish();

    // Update Company.
    companyState.batches.push(outputBatchId);
    updates[companyAddress] = Company.encode(companyState).finish();

    await context.setState(updates)
}

/**
 * Handle an Add Certificate To Batch transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch Batch identifier.
 * @param {String} company Company identifier.
 * @param {String} link External reference to certification document.
 * @param {String} hash Bytes string of SHA-512 of the external certification document.
 */
async function addBatchCertificate(
    context,
    signerPublicKey,
    timestamp,
    {batch, company, link, hash}
) {

    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`);

    // Validation: Company is not set.
    if (!company)
        reject(`Company is not set!`);

    // Validation: Link is not set.
    if (!link)
        reject(`Link is not set!`);

    // Validation: Hash is not set.
    if (!hash)
        reject(`Hash is not set!`);

    // Validation: Hash is not a valid SHA-512 value.
    if (!RegExp(`^[0-9A-Fa-f]{128}$`).test(hash))
        reject(`Provided hash doesn't contain a valid SHA-512 value!`);

    const certificationAuthorityAddress = getCertificationAuthorityAddress(signerPublicKey);
    const companyAddress = getCompanyAddress(company);
    const batchAddress = getBatchAddress(batch, company);

    const state = await context.getState([
        certificationAuthorityAddress,
        companyAddress,
        batchAddress
    ]);

    const certificationAuthorityState = CertificationAuthority.decode(state[certificationAuthorityAddress]);
    const companyState = Company.decode(state[companyAddress]);
    const batchState = Batch.decode(state[batchAddress]);

    // Validation: Transaction signer is not a Certification Authority.
    if (!state[certificationAuthorityAddress].length)
        reject(`You must be a Certification Authority to certify a Batch!`);

    // Validation: Provided value for company does not match with a Company.
    if (!state[companyAddress].length)
        reject(`The provided company ${company} is not a Company!`);

    // Validation: Provided value for batch does not match with a Company Batch.
    if (companyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`);

    // Validation: Certification Authority's products list doesn't contains one the Product Type of the Batch.
    if (certificationAuthorityState.products.indexOf(batchState.product) === -1)
        reject(`You cannot record this certification on a batch with ${batchState.product} product!`);

    // State update.
    const updates = {};

    // Record Certificate on Batch.
    batchState.certificates.push(Batch.Certificate.create({
        authority: signerPublicKey,
        link: link,
        hash: hash,
        timestamp: timestamp
    }));

    // Update Batch.
    updates[batchAddress] = Batch.encode(batchState).finish();

    await context.setState(updates)
}


/**
 * Handle Record of a Batch Property transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The Operator public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch Batch identifier.
 * @param {String} property PropertyType identifier.
 * @param {Object} propertyValue A PropertyValue used to update the Property list of values.
 */
async function recordBatchProperty(
    context,
    signerPublicKey,
    timestamp,
    {batch, property, propertyValue}
) {
    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`);

    // Validation: Property is not set.
    if (!property)
        reject(`Property is not set!`);

    // Validation: PropertyValue is not set.
    if (!propertyValue)
        reject(`Property Value is not set!`);

    const operatorAddress = getOperatorAddress(signerPublicKey);

    let state = await context.getState([
        operatorAddress
    ]);

    const operatorState = Operator.decode(state[operatorAddress]);

    // Validation: Transaction signer is not an Operator for a Company.
    if (!state[operatorAddress].length)
        reject(`You must be an Operator for a Company!`);

    const companyAddress = getCompanyAddress(operatorState.company);
    const batchAddress = getBatchAddress(batch, operatorState.company);
    const propertyTypeAddress = getPropertyTypeAddress(property);

    state = await context.getState([
        propertyTypeAddress,
        companyAddress,
        batchAddress
    ]);

    const propertyTypeState = PropertyType.decode(state[propertyTypeAddress]);
    const companyState = Company.decode(state[companyAddress]);
    const batchState = Batch.decode(state[batchAddress]);

    // Validation: Provided value for batch does not match with a Company Batch.
    if (companyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`);

    // Validation: Provided value for property type id in property value doesn't match with a valid Property Type.
    if (!state[propertyTypeAddress].length > 0)
        reject(`Provided Property Type id ${property} doesn't match with a valid Property Type!`);

    // Validation: Operator's task doesn't match one of the enabled Task Types for the Property Type.
    if (!(propertyTypeState.enabledTaskTypes.indexOf(operatorState.task) > -1))
        reject(`You cannot record this Property with a ${operatorState.task} task!`);

    // Validation: Batch Product Type doesn't match one of the enabled Product Types for the Property Type.
    if (propertyTypeState.enabledProductTypes.indexOf(batchState.product) === -1)
        reject(`You cannot record this Property on ${batch} Batch!`);

    // Validation: Check property value.
    checkField(propertyValue, propertyTypeState.type);

    // State update.
    const updates = {};

    if (!batchState.properties.some(propertyObj => propertyObj.propertyTypeId === property))
        batchState.properties.push(Batch.Property.create({
            propertyTypeId: property,
            values: [propertyValue]
        }));
    else {
        for (const propertyList of batchState.properties) {
            if ((propertyList).propertyTypeId === property) {
                (propertyList).values.push(propertyValue)
            }
        }
    }

    // Update Batch.
    updates[batchAddress] = Batch.encode(batchState).finish();

    await context.setState(updates)
}



module.exports = {
    createCompany,
    createField,
    createDescriptionEvent,
    createTransformationEvent,
    addBatchCertificate,
    recordBatchProperty
};