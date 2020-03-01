'use strict';

const Txn = require('./mock_txn');
const {
    SCPayload,
    SCPayloadActions,
    ProductType,
    EventType,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterTypeAction,
    CreateEventTypeAction,
    CreateCompanyAction,
    CreateOperatorAction,
    CreateCertificationAuthorityAction,
    CreateDescriptionEvent,
    CreateTransformationEvent,
    CreateFieldAction
} = require('../../services/proto');

/**
 * Execute a Create System Admin action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 */
const mockCreateSystemAdmin = async (context, handler) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_SYSADMIN,
            timestamp: Date.now()
        })
    );

    await handler.apply(txn, context);

    const privateKey = txn._privateKey;
    const publicKey = txn._publicKey;

    return {privateKey, publicKey};
};

/**
 * Execute a Create Task Type action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {String} id Task Type id.
 * @param {String} role Task Type role.
 */
const mockCreateTaskType = async (
    context,
    handler,
    sysAdminPrivateKey,
    id,
    role
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_TASK_TYPE,
            timestamp: Date.now(),
            createTaskType: CreateTaskTypeAction.create({
                id: id,
                role: role
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Product Type action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {String} id Product Type unique identifier.
 * @param {String} name Product name.
 * @param {String} description Product description.
 * @param {Number} measure Product unit of measure from enumeration of possible values.
 * @param {Object[]} derivedProducts List of identifiers and conversion rate for derived product types.
 */
const mockCreateProductType = async (
    context,
    handler,
    sysAdminPrivateKey,
    id,
    name,
    description,
    measure,
    derivedProducts
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_PRODUCT_TYPE,
            timestamp: Date.now(),
            createProductType: CreateProductTypeAction.create({
                id: id,
                name: name,
                description: description,
                measure: measure,
                derivedProducts: derivedProducts
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Event Parameter Type action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {String} id Event Parameter Type unique identifier.
 * @param {String} name Event Parameter name.
 * @param {Number} type Event Parameter type from enumeration of possible values.
 */
const mockCreateEventParameterType = async (
    context,
    handler,
    sysAdminPrivateKey,
    id,
    name,
    type
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
            timestamp: Date.now(),
            createEventParameterType: CreateEventParameterTypeAction.create({
                id: id,
                name: name,
                type: type
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Event Parameter Type action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {String} id Event Type unique identifier.
 * @param {Number} typology Event Type typology from enumeration of possible values.
 * @param {String} name Event name.
 * @param {String} description Event description.
 * @param {String[]} parameters List of identifiers of Event Parameter Types that customize the Event Type data.
 * @param {String[]} enabledTaskTypes List of identifiers of Task Types which Operators must have to record the Event Type.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the Event Type can be recorded.
 * @param {String[]} derivedProductTypes List of identifiers of derived Product Types.
 */
const mockCreateEventType = async (
    context,
    handler,
    sysAdminPrivateKey,
    id,
    typology,
    name,
    description,
    parameters,
    enabledTaskTypes,
    enabledProductTypes,
    derivedProductTypes
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_EVENT_TYPE,
            timestamp: Date.now(),
            createEventType: CreateEventTypeAction.create({
                id: id,
                typology: typology,
                name: name,
                description: description,
                parameters: parameters,
                enabledTaskTypes: enabledTaskTypes,
                enabledProductTypes: enabledProductTypes,
                derivedProductTypes: derivedProductTypes
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Company action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {String} name Company name.
 * @param {String} description Company description.
 * @param {String} website Company website.
 * @param {String} cmpAdminPublicKey Company Admin public key.
 */
const mockCreateCompany = async (
    context,
    handler,
    sysAdminPrivateKey,
    name,
    description,
    website,
    cmpAdminPublicKey
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_COMPANY,
            timestamp: Date.now(),
            createCompany: CreateCompanyAction.create({
                name: name,
                description: description,
                website: website,
                admin: cmpAdminPublicKey
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Field action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} cmpAdminPrivateKey The Company Admin public key.
 * @param {String} id Field id.
 * @param {String} description Field description.
 * @param {String} product Field cultivable Product Type.
 * @param {float} productQuantity Field predicted production quantity.
 * @param {Object} location Field location coordinates.
 */
const mockCreateField = async (
    context,
    handler,
    cmpAdminPrivateKey,
    id,
    description,
    product,
    productQuantity,
    location
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_FIELD,
            timestamp: Date.now(),
            createField: CreateFieldAction.create({
                id: id,
                description: description,
                product: product,
                quantity: productQuantity,
                location: location
            })
        }),
        cmpAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Operator action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} cmpAdminPrivateKey The Company Admin private key.
 * @param {String} optPublicKey Operator public key.
 * @param {String} task Task Type identifier for Operator task.
 */
const mockCreateOperator = async (
    context,
    handler,
    cmpAdminPrivateKey,
    optPublicKey,
    task
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_OPERATOR,
            timestamp: Date.now(),
            createOperator: CreateOperatorAction.create({
                publicKey: optPublicKey,
                task: task
            })
        }),
        cmpAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Certification Authority action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 * @param {Object} publicKey The Certification Authority public key.
 * @param {String} name The Certification Authority name.
 * @param {String[]} products The products where the Certification Authority is enabled to issue certificates.
 */
const mockCreateCertificationAuthority = async (
    context,
    handler,
    sysAdminPrivateKey,
    publicKey,
    name,
    products
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
            timestamp: Date.now(),
            createCertificationAuthority: CreateCertificationAuthorityAction.create({
                publicKey: caKeyPair.publicKey,
                name: name,
                products: products
            })
        }),
        sysAdminPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Execute a Create Description Event action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} optPrivateKey The Operator private key.
 * @param {String} eventTypeId EventType unique identifier.
 * @param {String} batch Input batch where Event will be recorded.
 * @param {String} field Input field where Event will be recorded.
 * @param {Object[]} values Unique identifiers and values of different EventParameterValues.
 */
const mockCreateDescriptionEvent = async (
    context,
    handler,
    optPrivateKey,
    eventTypeId,
    batch,
    field,
    values
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEvent.create({
                eventTypeId: eventTypeId,
                field: field,
                batch: batch,
                values: values
            })
        }),
        optPrivateKey
    );

    await handler.apply(txn, context);
};


/**
 * Execute a Create Transformation Event action.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} optPrivateKey The Operator private key.
 * @param {String} eventTypeId EventType unique identifier.
 * @param {String[]} batches Input batches to transform.
 * @param {String[]} fields Input fields to transform.
 * @param {float[]} quantities Input quantities to subtract from fields or batches.
 * @param {String} derivedProduct Output Product Type for the output Batch.
 * @param {String} outputBatchId Output Batch identifier.
 */
const mockCreateTransformationEvent = async (
    context,
    handler,
    optPrivateKey,
    eventTypeId,
    batches,
    fields,
    quantities,
    derivedProduct,
    outputBatchId
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEvent.create({
                eventTypeId: eventTypeId,
                fields: fields,
                batches: batches,
                quantities: quantities,
                derivedProduct: derivedProduct,
                outputBatchId: outputBatchId
            })
        }),
        optPrivateKey
    );

    await handler.apply(txn, context);
};

/**
 * Populate a food supply-chain with mock data.
 * @param {Context} context Current state context.
 * @param {SawChainHandlerWrapper} handler Current instance of SawChain transaction handler wrapper.
 * @param {String} sysAdminPrivateKey System Admin private key.
 */
const populateStateWithMockData = async (context, handler, sysAdminPrivateKey) => {
    // Task types.
    await mockCreateTaskType(context, handler, sysAdminPrivateKey, "task1", "role1");
    await mockCreateTaskType(context, handler, sysAdminPrivateKey, "task2", "role2");
    await mockCreateTaskType(context, handler, sysAdminPrivateKey, "task3", "role3");

    // Product Types.
    const derivedProd1 = ProductType.DerivedProduct.create({
        derivedProductType: "prd1",
        conversionRate: 0.8
    });

    const derivedProd2 = ProductType.DerivedProduct.create({
        derivedProductType: "prd2",
        conversionRate: 0.7
    });

    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd1", "name1", "desc1", 3, []); // Bottles.
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd2", "name2", "desc2", 1, [derivedProd1]); // Olive oil.
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd3", "name3", "desc3", 0, [derivedProd2]); // Olives.

    // Event Parameter Types.
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param1", "name1", 0);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param2", "name2", 1);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param3", "name3", 2);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param4", "name4", 0);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param5", "name5", 1);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param6", "name6", 2);

    // Event Types.
    const param1 = EventType.EventParameter.create({
        parameterTypeId: "param1",
        required: true,
        minValue: 10,
        maxValue: 100
    });
    const param2 = EventType.EventParameter.create({
        parameterTypeId: "param2",
        required: true,
        minLength: 3,
        maxLength: 10
    });
    const param3 = EventType.EventParameter.create({
        parameterTypeId: "param3",
        required: true
    });

    const param4 = EventType.EventParameter.create({
        parameterTypeId: "param4",
        required: false,
        minValue: 10,
        maxValue: 100
    });
    const param5 = EventType.EventParameter.create({
        parameterTypeId: "param5",
        required: false,
        minLength: 1,
        maxLength: 10
    });
    const param6 = EventType.EventParameter.create({
        parameterTypeId: "param6",
        required: false
    });

    // Description events.
    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event1",
        EventType.EventTypology.DESCRIPTION,
        "name1",
        "desc1",
        [param1, param2, param3],
        ["task1"],
        ["prd3"],
        []
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event2",
        EventType.EventTypology.DESCRIPTION,
        "name2",
        "desc2",
        [param4, param5, param6],
        ["task1"],
        ["prd3"],
        []
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event3",
        EventType.EventTypology.DESCRIPTION,
        "name3",
        "desc3",
        [param1, param4],
        ["task1"],
        ["prd2"],
        []
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event4",
        EventType.EventTypology.DESCRIPTION,
        "name4",
        "desc4",
        [param4],
        ["task2"],
        ["prd2"],
        []
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event5",
        EventType.EventTypology.DESCRIPTION,
        "name5",
        "desc5",
        [],
        ["task1"],
        ["prd3"],
        []
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event6",
        EventType.EventTypology.DESCRIPTION,
        "name6",
        "desc6",
        [param1, param4],
        ["task1"],
        ["prd3"],
        []
    );

    // Transformation events.
    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event7",
        EventType.EventTypology.TRANSFORMATION,
        "name7",
        "desc7",
        [],
        ["task1"],
        ["prd3"],
        ["prd2"]
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event8",
        EventType.EventTypology.TRANSFORMATION,
        "name8",
        "desc8",
        [],
        ["task2"],
        ["prd3"],
        ["prd2"]
    );

    await mockCreateEventType(context, handler, sysAdminPrivateKey,
        "event9",
        EventType.EventTypology.TRANSFORMATION,
        "name9",
        "desc9",
        [],
        ["task1"],
        ["prd2"],
        ["prd1"]
    );

};

module.exports = {
    mockCreateSystemAdmin,
    mockCreateTaskType,
    mockCreateProductType,
    mockCreateEventParameterType,
    mockCreateOperator,
    mockCreateCertificationAuthority,
    populateStateWithMockData,
    mockCreateCompany,
    mockCreateField,
    mockCreateDescriptionEvent,
    mockCreateTransformationEvent
};