'use strict';

const Txn = require('./mock_txn');
const {
    SCPayload,
    SCPayloadActions,
    EventType,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterTypeAction,
    CreateEventTypeAction,
    CreateCompanyAction
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
 * @param {String[]} derivedProductsType List of identifiers of derived product types.
 */
const mockCreateProductType = async (
    context,
    handler,
    sysAdminPrivateKey,
    id,
    name,
    description,
    measure,
    derivedProductsType
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
                derivedProductsType: derivedProductsType
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
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd1", "name1", "desc1", 3, []);
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd2", "name2", "desc2", 1, ["prd1"]);
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd3", "name3", "desc3", 1, ["prd1"]);
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd4", "name4", "desc4", 0, ["prd2"]);
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd5", "name5", "desc5", 0, ["prd3"]);
    await mockCreateProductType(context, handler, sysAdminPrivateKey, "prd6", "name6", "desc6", 0, ["prd4"]);

    // Event Parameter Types.
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param1", "name1", 0);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param2", "name2", 1);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param3", "name3", 2);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param4", "name4", 3);
    await mockCreateEventParameterType(context, handler, sysAdminPrivateKey, "param5", "name5", 4);

    // Event Types.
    const param1 = EventType.EventParameter.create({
        parameterTypeId: "param1",
        required: true,
        minValue: 1,
        maxValue: 1000
    });
    const param2 = EventType.EventParameter.create({
        parameterTypeId: "param2",
        required: true,
        maxLength: 100
    });
    const param3 = EventType.EventParameter.create({
        parameterTypeId: "param3",
        required: false
    });

    await mockCreateEventType(context, handler, sysAdminPrivateKey, "event1", EventType.EventTypology.TRANSFORMATION, "name1", "desc1", [param1, param2], ["task1"], ["prd2", "prd3"], ["prd1"]);
    await mockCreateEventType(context, handler, sysAdminPrivateKey, "event2", EventType.EventTypology.DESCRIPTION, "name2", "desc2", [param3], ["task2"], ["prd4", "prd5"]);
    await mockCreateEventType(context, handler, sysAdminPrivateKey, "event3", EventType.EventTypology.DESCRIPTION, "name3", "desc3", [param1, param3], ["task3"], ["prd1"]);
    await mockCreateEventType(context, handler, sysAdminPrivateKey, "event4", EventType.EventTypology.TRANSFORMATION, "name4", "desc4", [param1, param2], ["task1"], ["prd4"], ["prd2"]);
    await mockCreateEventType(context, handler, sysAdminPrivateKey, "event5", EventType.EventTypology.TRANSFORMATION, "name5", "desc5", [param1, param2], ["task1"], ["prd6"], ["prd4"]);
};

module.exports = {
    mockCreateSystemAdmin,
    mockCreateTaskType,
    mockCreateProductType,
    mockCreateEventParameterType,
    populateStateWithMockData,
    mockCreateCompany
};