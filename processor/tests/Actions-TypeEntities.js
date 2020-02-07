'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const AgriChainHandler = require('./services/handler_wrapper');
const {createSystemAdmin} = require('./services/mock_entities');
const {
    ACPayload,
    ACPayloadActions,
    TaskType,
    ProductType,
    EventParameterType,
    EventType,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterType,
    CreateEventType,
} = require('../services/proto');
const {
    getTaskTypeAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress
} = require('../services/addressing');

describe('Types Creation', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    let keyPairSA = null;

    before(async function () {
        handler = new AgriChainHandler();
        context = new Context();

        keyPairSA = await createSystemAdmin(context, handler);
    });

    describe('Create Task Type', function () {
        let taskTypeId = "mock-taskType-id";
        let taskTypeRole = "mock-taskType-role";

        const taskTypeAddress = getTaskTypeAddress(taskTypeId);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no role is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if current System Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId,
                        role: taskTypeRole
                    })
                })
            );
            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Task Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId,
                        role: taskTypeRole
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[taskTypeAddress];

            expect(state).to.not.be.null;
            expect(TaskType.decode(state).id).to.equal(taskTypeId);
            expect(TaskType.decode(state).role).to.equal(taskTypeRole);
        });

        it('Should reject if given id is already associated to a Task Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId,
                        role: taskTypeRole
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Product Type', function () {
        const productTypeId = "mock-productType-id";
        const productTypeName = "mock-productType-name";
        const productTypeDescription = "mock-productType-description";
        const productTypeUnitOfMeasure = ProductType.UnitOfMeasure.KILOS;

        const productTypeId2 = "mock-product-id2";
        const productTypeName2 = "mock-product-name2";
        const productTypeDescription2 = "mock-product-description2";
        const productTypeUnitOfMeasure2 = ProductType.UnitOfMeasure.LITRE;
        const derivedProductsType = ["mock-productType-id"];

        const productTypeAddress = getProductTypeAddress(productTypeId);
        const productTypeAddress2 = getProductTypeAddress(productTypeId2);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    createProductType: CreateProductTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no valid unit of measure is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName,
                        description: productTypeDescription,
                        measure: -1
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if current System Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName,
                        description: productTypeDescription,
                        measure: productTypeUnitOfMeasure
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of given derived products types is not recorded yet', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName,
                        description: productTypeDescription,
                        measure: productTypeUnitOfMeasure,
                        derivedProductsType: derivedProductsType
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Product Type with no derived products associated', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName,
                        description: productTypeDescription,
                        measure: productTypeUnitOfMeasure
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[productTypeAddress];

            expect(state).to.not.be.null;
            expect(ProductType.decode(state).id).to.equal(productTypeId);
            expect(ProductType.decode(state).name).to.equal(productTypeName);
            expect(ProductType.decode(state).description).to.equal(productTypeDescription);
            expect(ProductType.decode(state).measure).to.equal(productTypeUnitOfMeasure);
            expect(ProductType.decode(state).derivedProductsType).to.be.empty;
        });

        it('Should create the Product Type with derived products associated', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId2,
                        name: productTypeName2,
                        description: productTypeDescription2,
                        measure: productTypeUnitOfMeasure2,
                        derivedProductsType: derivedProductsType
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[productTypeAddress2];

            expect(state).to.not.be.null;
            expect(ProductType.decode(state).id).to.equal(productTypeId2);
            expect(ProductType.decode(state).name).to.equal(productTypeName2);
            expect(ProductType.decode(state).description).to.equal(productTypeDescription2);
            expect(ProductType.decode(state).measure).to.equal(productTypeUnitOfMeasure2);
            expect(ProductType.decode(state).derivedProductsType[0]).to.equal(derivedProductsType[0]);
        });

        it('Should reject if given id is already associated to a Product Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productTypeId,
                        name: productTypeName,
                        description: productTypeDescription,
                        measure: productTypeUnitOfMeasure
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Event Parameter Type', function () {
        const eventParameterTypeId = "mock-eventParameterType-id";
        const eventParameterTypeName = "mock-eventParameterType-name";
        const eventParameterType = EventParameterType.Type.STRING;

        const eventParameterTypeAddress = getEventParameterTypeAddress(eventParameterTypeId);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    createEventParameterType: CreateEventParameterType.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({
                        id: eventParameterTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no valid type is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: 10
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if current System Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: eventParameterType
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Event Parameter Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: eventParameterType
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[eventParameterTypeAddress];

            expect(state).to.not.be.null;
            expect(EventParameterType.decode(state).id).to.equal(eventParameterTypeId);
            expect(EventParameterType.decode(state).name).to.equal(eventParameterTypeName);
            expect(EventParameterType.decode(state).type).to.equal(eventParameterType);
        });

        it('Should reject if given id is already associated to an Event Parameter Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterType.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: eventParameterType
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Event Type', function () {
        const eventTypeId = "mock-eventType-id";
        const eventTypeName = "mock-eventType-name";
        const eventTypeDescription = "mock-eventType-description";

        const eventTypeId2 = "mock-eventType-id2";
        const eventTypeName2 = "mock-eventType-name2";
        const eventTypeDescription2 = "mock-eventType-description2";

        const eventTypeParameters = [
            EventType.EventParameter.create({
                    parameterTypeId: "mock-eventParameterType-id",
                    required: true,
                    maxLength: 100
                })
            ];

        const enabledTaskTypes = ["mock-taskType-id"];
        const enabledProductTypes = ["mock-productType-id"];

        const eventTypeAddress = getEventTypeAddress(eventTypeId);
        const eventTypeAddress2 = getEventTypeAddress(eventTypeId2);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    createEventType: CreateEventParameterType.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if current System Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given parameters type are not recorded yet', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription,
                        parameters:
                            [
                                EventType.EventParameter.create({
                                    parameterTypeId: "no-type",
                                    required: true
                                }),
                                EventType.EventParameter.create({
                                    parameterTypeId: "no-type2",
                                    required: false
                                })
                            ]
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given enabled task types are not recorded yet', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledTaskTypes: [
                            "mock-taskType-id100"
                        ]
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given enabled product types are not recorded yet', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledProductTypes: [
                            "mock-productType-id100"
                        ]
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Event Type with no parameters', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription,
                        enabledTaskTypes: enabledTaskTypes,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[eventTypeAddress];

            expect(state).to.not.be.null;
            expect(EventType.decode(state).id).to.equal(eventTypeId);
            expect(EventType.decode(state).name).to.equal(eventTypeName);
            expect(EventType.decode(state).description).to.equal(eventTypeDescription);
            expect(EventType.decode(state).parameters).to.be.empty;
            expect(EventType.decode(state).enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0]);
            expect(EventType.decode(state).enabledProductTypes[0]).to.be.equal(enabledProductTypes[0]);
        });

        it('Should create the Event Type with parameters', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId2,
                        name: eventTypeName2,
                        description: eventTypeDescription2,
                        parameters: eventTypeParameters,
                        enabledTaskTypes: enabledTaskTypes,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[eventTypeAddress2];

            expect(state).to.not.be.null;
            expect(EventType.decode(state).id).to.equal(eventTypeId2);
            expect(EventType.decode(state).name).to.equal(eventTypeName2);
            expect(EventType.decode(state).description).to.equal(eventTypeDescription2);
            expect(EventType.decode(state).parameters[0].parameterTypeId).to.be.equal(eventTypeParameters[0].parameterTypeId);
            expect(EventType.decode(state).enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0]);
            expect(EventType.decode(state).enabledProductTypes[0]).to.be.equal(enabledProductTypes[0]);
        });

        it('Should reject if given id is already associated to an Event Type', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventType.create({
                        id: eventTypeId,
                        name: eventTypeName,
                        description: eventTypeDescription
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

});