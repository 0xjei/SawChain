'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {mockCreateSystemAdmin} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    TaskType,
    ProductType,
    EventParameterType,
    EventType,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterTypeAction,
    CreateEventTypeAction,
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

    let sysAdminKeys = null;

    before(async function () {
        handler = new SawChainHandler();
        context = new Context();

        // Record the System Admin and get key pair.
        sysAdminKeys = await mockCreateSystemAdmin(context, handler);
    });

    describe('Create Task Type', function () {
        const taskTypeId = "mock-taskType-id";
        const taskTypeRole = "mock-taskType-role";

        const taskTypeAddress = getTaskTypeAddress(taskTypeId);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no role is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
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
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId,
                        role: taskTypeRole
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[taskTypeAddress];

            expect(state).to.not.be.null;
            expect(TaskType.decode(state).id).to.equal(taskTypeId);
            expect(TaskType.decode(state).role).to.equal(taskTypeRole);
        });

        it('Should reject if there is a Task Type already associated to given id', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({
                        id: taskTypeId,
                        role: taskTypeRole
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Product Type', function () {
        const firstProductTypeId = "mock-productType-id";
        const firstProductTypeName = "mock-productType-name";
        const firstProductTypeDescription = "mock-productType-description";
        const firstProductTypeUnitOfMeasure = ProductType.UnitOfMeasure.KILOS;

        const secondProductTypeId = "mock-productType-id2";
        const secondProductTypeName2 = "mock-productType-name2";
        const secondProductTypeDescription2 = "mock-productType-description2";
        const secondProductTypeUnitOfMeasure2 = ProductType.UnitOfMeasure.LITRE;
        const derivedProducts = [
            ProductType.DerivedProduct.create({
                derivedProductType: "mock-productType-id",
                conversionRate: 0.8
            })
        ];

        const firstProductTypeAddress = getProductTypeAddress(firstProductTypeId);
        const secondProductTypeAddress = getProductTypeAddress(secondProductTypeId);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided measure doesn\'t match one of the possible values', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName,
                        description: firstProductTypeDescription,
                        measure: -1
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName,
                        description: firstProductTypeDescription,
                        measure: firstProductTypeUnitOfMeasure
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for derivedProducts doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName,
                        description: firstProductTypeDescription,
                        measure: firstProductTypeUnitOfMeasure,
                        derivedProducts: derivedProducts
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create a Product Type with no derived products associated', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName,
                        description: firstProductTypeDescription,
                        measure: firstProductTypeUnitOfMeasure
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[firstProductTypeAddress];

            expect(state).to.not.be.null;
            expect(ProductType.decode(state).id).to.equal(firstProductTypeId);
            expect(ProductType.decode(state).name).to.equal(firstProductTypeName);
            expect(ProductType.decode(state).description).to.equal(firstProductTypeDescription);
            expect(ProductType.decode(state).measure).to.equal(firstProductTypeUnitOfMeasure);
            expect(ProductType.decode(state).derivedProducts).to.be.empty;
        });

        /// todo
        it('Should reject if at least one of the provided values for derivedProducts doesn\'t have a conversionRate greater than 0', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: secondProductTypeId,
                        name: secondProductTypeName2,
                        description: secondProductTypeDescription2,
                        measure: secondProductTypeUnitOfMeasure2,
                        derivedProducts: [
                            ProductType.DerivedProduct.create({
                                derivedProductType: "mock-productType-id",
                                conversionRate: 0.0
                            })
                        ]
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create a Product Type with derived products associated', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: secondProductTypeId,
                        name: secondProductTypeName2,
                        description: secondProductTypeDescription2,
                        measure: secondProductTypeUnitOfMeasure2,
                        derivedProducts: derivedProducts
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[secondProductTypeAddress];

            expect(state).to.not.be.null;
            expect(ProductType.decode(state).id).to.equal(secondProductTypeId);
            expect(ProductType.decode(state).name).to.equal(secondProductTypeName2);
            expect(ProductType.decode(state).description).to.equal(secondProductTypeDescription2);
            expect(ProductType.decode(state).measure).to.equal(secondProductTypeUnitOfMeasure2);
            expect(ProductType.decode(state).derivedProducts.length).to.equal(1);
        });

        it('Should reject if there is a Product Type already associated to given id', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: firstProductTypeId,
                        name: firstProductTypeName,
                        description: firstProductTypeDescription,
                        measure: firstProductTypeUnitOfMeasure
                    })
                }),
                sysAdminKeys.privateKey
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
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({
                        id: eventParameterTypeId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided value for type doesn\'t one of the possible values', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: 10
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({
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
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: eventParameterType
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[eventParameterTypeAddress];

            expect(state).to.not.be.null;
            expect(EventParameterType.decode(state).id).to.equal(eventParameterTypeId);
            expect(EventParameterType.decode(state).name).to.equal(eventParameterTypeName);
            expect(EventParameterType.decode(state).type).to.equal(eventParameterType);

        });

        it('Should reject if there is an Event Parameter Type already associated to given id', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
                    timestamp: Date.now(),
                    createEventParameterType: CreateEventParameterTypeAction.create({
                        id: eventParameterTypeId,
                        name: eventParameterTypeName,
                        type: eventParameterType
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Event Type', function () {
        const firstEventTypeId = "mock-eventType-id";
        const firstEventTypology = EventType.EventTypology.DESCRIPTION;
        const firstEventTypeName = "mock-eventType-name";
        const firstEventTypeDescription = "mock-eventType-description";

        const secondEventTypeId = "mock-eventType-id2";
        const secondEventTypology = EventType.EventTypology.DESCRIPTION;
        const secondEventTypeName = "mock-eventType-name2";
        const secondEventTypeDescription = "mock-eventType-description2";

        const eventTypeParameters = [
            EventType.EventParameter.create({
                parameterTypeId: "mock-eventParameterType-id",
                required: true,
                maxLength: 100
            })
        ];

        const enabledTaskTypes = ["mock-taskType-id"];
        const enabledProductTypes = ["mock-productType-id"];

        const firstEventTypeAddress = getEventTypeAddress(firstEventTypeId);
        const secondEventTypeAddress = getEventTypeAddress(secondEventTypeId);

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided value for typology doesn\'t match one of the possible values', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: -1
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for parameters doesn\'t match a valid Event Parameter Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
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
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for enable task types doesn\'t match a valid Task Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledTaskTypes: [
                            "mock-taskType-id100"
                        ]
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for enable product types doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledProductTypes: [
                            "mock-productType-id100"
                        ]
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no derived products for transformation event typology', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: EventType.EventTypology.TRANSFORMATION,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledProductTypes: enabledProductTypes,
                        derivedProductTypes: []
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if ferived products are given for description event', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledProductTypes: enabledProductTypes,
                        derivedProductTypes: [
                            "mock-productType-id"
                        ]
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for derived product types doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledProductTypes: enabledProductTypes,
                        derivedProductTypes: [
                            "mock-productType-id100"
                        ]
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Event Type with no parameters', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription,
                        enabledTaskTypes: enabledTaskTypes,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[firstEventTypeAddress];

            expect(state).to.not.be.null;
            expect(EventType.decode(state).id).to.equal(firstEventTypeId);
            expect(EventType.decode(state).name).to.equal(firstEventTypeName);
            expect(EventType.decode(state).description).to.equal(firstEventTypeDescription);
            expect(EventType.decode(state).parameters).to.be.empty;
            expect(EventType.decode(state).enabledTaskTypes.length).to.be.equal(1);
            expect(EventType.decode(state).enabledProductTypes.length).to.be.equal(1);
        });

        it('Should create the Event Type with parameters', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: secondEventTypeId,
                        typology: secondEventTypology,
                        name: secondEventTypeName,
                        description: secondEventTypeDescription,
                        parameters: eventTypeParameters,
                        enabledTaskTypes: enabledTaskTypes,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                sysAdminKeys.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[secondEventTypeAddress];

            expect(state).to.not.be.null;
            expect(EventType.decode(state).id).to.equal(secondEventTypeId);
            expect(EventType.decode(state).name).to.equal(secondEventTypeName);
            expect(EventType.decode(state).description).to.equal(secondEventTypeDescription);
            expect(EventType.decode(state).parameters.length).to.be.equal(1);
            expect(EventType.decode(state).enabledTaskTypes.length).to.be.equal(1);
            expect(EventType.decode(state).enabledProductTypes.length).to.be.equal(1);
        });

        it('Should reject if there is a Event Type already associated to given id', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_EVENT_TYPE,
                    timestamp: Date.now(),
                    createEventType: CreateEventTypeAction.create({
                        id: firstEventTypeId,
                        typology: firstEventTypology,
                        name: firstEventTypeName,
                        description: firstEventTypeDescription
                    })
                }),
                sysAdminKeys.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });
});