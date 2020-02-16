const Txn = require('./mock_txn');
const {
    ACPayload,
    ACPayloadActions,
    EventType,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterTypeAction,
    CreateEventTypeAction
} = require('../../services/proto');

const mockCreateSystemAdmin = async (context, handler) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_SYSADMIN,
            timestamp: Date.now()
        })
    );

    await handler.apply(txn, context);

    const privateKey = txn._privateKey;
    const publicKey = txn._publicKey;

    return {privateKey, publicKey};
};

const mockCreateTaskType = async (context, handler, prvKeySA, id, role) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_TASK_TYPE,
            timestamp: Date.now(),
            createTaskType: CreateTaskTypeAction.create({
                id: id,
                role: role
            })
        }),
        prvKeySA
    );

    await handler.apply(txn, context);
};

const mockCreateProductType = async (context, handler, prvKeySA, id, name, desc, uom, derivedPrds) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_PRODUCT_TYPE,
            timestamp: Date.now(),
            createProductType: CreateProductTypeAction.create({
                id: id,
                name: name,
                description: desc,
                measure: uom,
                derivedProductsType: derivedPrds
            })
        }),
        prvKeySA
    );

    await handler.apply(txn, context);
};

const mockCreateEventParameterType = async (context, handler, prvKeySA, id, name, type) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
            timestamp: Date.now(),
            createEventParameterType: CreateEventParameterTypeAction.create({
                id: id,
                name: name,
                type: type
            })
        }),
        prvKeySA
    );

    await handler.apply(txn, context);
};

const mockCreateEventType = async (context, handler, prvKeySA, id, name, desc, params, taskTypes, prodTypes) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_EVENT_TYPE,
            timestamp: Date.now(),
            createEventType: CreateEventTypeAction.create({
                id: id,
                name: name,
                description: desc,
                parameters: params,
                enabledTaskTypes: taskTypes,
                enabledProductTypes: prodTypes
            })
        }),
        prvKeySA
    );

    await handler.apply(txn, context);
};

const bootstrapSystem = async (context, handler, prvKeySA) => {
    // Task types.
    await mockCreateTaskType(context, handler, prvKeySA, "task1", "role1");
    await mockCreateTaskType(context, handler, prvKeySA, "task2", "role2");
    await mockCreateTaskType(context, handler, prvKeySA, "task3", "role3");

    // Product Types.
    await mockCreateProductType(context, handler, prvKeySA, "prd1", "name1", "desc1", 3, []);
    await mockCreateProductType(context, handler, prvKeySA, "prd2", "name2", "desc2", 1, ["prd1"]);
    await mockCreateProductType(context, handler, prvKeySA, "prd3", "name3", "desc3", 1, ["prd1"]);
    await mockCreateProductType(context, handler, prvKeySA, "prd4", "name4", "desc4", 0, ["prd2"]);
    await mockCreateProductType(context, handler, prvKeySA, "prd5", "name5", "desc5", 0, ["prd3"]);

    // Event Parameter Types.
    await mockCreateEventParameterType(context, handler, prvKeySA, "param1", "name1", 0);
    await mockCreateEventParameterType(context, handler, prvKeySA, "param2", "name2", 1);
    await mockCreateEventParameterType(context, handler, prvKeySA, "param3", "name3", 2);
    await mockCreateEventParameterType(context, handler, prvKeySA, "param4", "name4", 3);
    await mockCreateEventParameterType(context, handler, prvKeySA, "param5", "name5", 4);

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

    await mockCreateEventType(context, handler, prvKeySA, "event1", "name1", "desc1", [param1, param2], ["task1"], ["prd2", "prd3"]);
    await mockCreateEventType(context, handler, prvKeySA, "event2", "name2", "desc2", [param3], ["task2"], ["prd4", "prd5"]);
    await mockCreateEventType(context, handler, prvKeySA, "event3", "name3", "desc3", [param1, param3], ["task3"], ["prd1"]);
};

module.exports = {
    mockCreateSystemAdmin,
    mockCreateTaskType,
    mockCreateProductType,
    mockCreateEventParameterType,
    bootstrapSystem
};