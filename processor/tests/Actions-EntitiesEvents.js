'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    mockCreateSystemAdmin,
    mockCreateOperator,
    mockCreateField,
    mockCreateCompany,
    mockCreateTransformationEvent,
    populateStateWithMockData
} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    Company,
    Field,
    Event,
    Batch,
    Location,
    CreateDescriptionEventAction,
    CreateTransformationEventAction
} = require('../services/proto');
const {
    getOperatorAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress
} = require('../services/addressing');
const {
    getSHA512,
    getNewKeyPair
} = require('../services/utils');

describe('Entities Events Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    let sysAdminKeyPair = null;
    let cmpAdminKeyPair = null;
    let optKeyPair = null;

    let companyId = null;

    let fieldAddress = null;
    let batchAddress = null;
    let companyAddress = null;
    let operatorAddress = null;

    // Field Data.
    const fieldId = "field1";
    const fieldProduct = "prd3";
    const productQuantity = 150000;
    const location = Location.create({
        latitude: 39.23054,
        longitude: 9.11917
    });

    const batchId = "batch1";

    before(async function () {
        handler = new SawChainHandler();
        context = new Context();

        // Record the System Admin and get key pair.
        sysAdminKeyPair = await mockCreateSystemAdmin(context, handler);

        // Populate the state with mock types.
        await populateStateWithMockData(context, handler, sysAdminKeyPair.privateKey);

        // Company Admin key pair.
        cmpAdminKeyPair = getNewKeyPair();
        companyId = getSHA512(cmpAdminKeyPair.publicKey, 10);

        // Company address.
        companyAddress = getCompanyAddress(getSHA512(cmpAdminKeyPair.publicKey, 10));

        // Create Company.
        await mockCreateCompany(context, handler, sysAdminKeyPair.privateKey, "company1", "desc1", "web1", cmpAdminKeyPair.publicKey);

        // Create Operator.
        optKeyPair = getNewKeyPair();
        operatorAddress = getOperatorAddress(optKeyPair.publicKey);
        await mockCreateOperator(context, handler, cmpAdminKeyPair.privateKey, optKeyPair.publicKey, "task1");

        // Create Field.
        fieldAddress = getFieldAddress(fieldId, companyId);
        await mockCreateField(context, handler, cmpAdminKeyPair.privateKey, fieldId, "desc1", fieldProduct, productQuantity, location);

        // Create Batch.
        batchAddress = getBatchAddress(batchId, companyId);
        await mockCreateTransformationEvent(context, handler, optKeyPair.privateKey, "event7", [], [fieldId], [100], "prd2", batchId);
    });

    describe('Create Event Actions', async function () {
        describe('Description Event', async function () {
            const eventTypeIdReqParams = "event1";
            const eventTypeIdNoParams = "event5";
            const eventTypeIdNoReqParams = "event2";
            const eventTypeIdReqAndNoReqParams = "event6";
            const eventTypeIdTransfEvent = "event7";

            // Parameter values.
            const valuesReqParams = [
                Event.EventParameterValue.create({
                    parameterTypeId: "param1",
                    floatValue: 99
                }),
                Event.EventParameterValue.create({
                    parameterTypeId: "param2",
                    stringValue: "aaaaaaaaa"
                }),
                Event.EventParameterValue.create({
                    parameterTypeId: "param3",
                    bytesValue: ['0xABC']
                })
            ];

            const valuesNoReqParams = [
                Event.EventParameterValue.create({
                    parameterTypeId: "param4",
                    floatValue: 99
                })
            ];

            const valuesReqAndNoReqParams = [
                Event.EventParameterValue.create({
                    parameterTypeId: "param1",
                    floatValue: 99
                }),
                Event.EventParameterValue.create({
                    parameterTypeId: "param4",
                    floatValue: 99
                })
            ];

            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction);
            });

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now()
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no Event Type id is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({})
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if Batch or Field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if both Batch and Field are given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            batch: "batch"
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if transaction signer is not an Operator for a Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided value for eventTypeId doesn\'t match a valid Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: "no-event-type-id",
                            field: fieldId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided Event Type identifier doesn\'t match a description Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdTransfEvent,
                            field: fieldId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the Operator\'s task is not a valid enabled Task Type for the provided Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: "event4",
                            field: fieldId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the Event Type has at least one EventParameter required but no values are given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no correct value field is provided for a required parameter of type number', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    stringValue: "wrong-type-value"
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided number value is lower than the minimum value constraint for a parameter of type number', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 1
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided number value is greater than the maximum value constraint for a parameter of type number', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 101
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no correct value field is provided for a required parameter of type string', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 99
                                }),
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param2",
                                    floatValue: 1
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided string value is lower than the minimum length constraint for a parameter of type string', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 99
                                }),
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param2",
                                    stringValue: "aa"
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided string value is greater than the maximum length constraint for a parameter of type string', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 99
                                }),
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param2",
                                    stringValue: "aaaaaaaaaaa"
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no correct value field is provided for a required parameter of type bytes', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                        timestamp: Date.now(),
                        createDescriptionEvent: CreateDescriptionEventAction.create({
                            eventTypeId: eventTypeIdReqParams,
                            field: fieldId,
                            values: [
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param1",
                                    floatValue: 99
                                }),
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param2",
                                    stringValue: "aaaaaaaaa"
                                }),
                                Event.EventParameterValue.create({
                                    parameterTypeId: "param3",
                                    stringValue: ""
                                })
                            ]
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            describe('Create Description Event on Field', async function () {
                it('Should reject if provided field is not a Company Field', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: Date.now(),
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqParams,
                                field: "no-field"
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if the field Product Type doesn\'t match one of the enabled Product Types for the Event Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: Date.now(),
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: "event3",
                                field: fieldId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should create an Event with no parameters on the provided Field', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdNoParams,
                                field: fieldId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Field.
                    state = context._state[fieldAddress];

                    expect(state).to.not.be.null;
                    expect(Field.decode(state).events.length).to.equal(2);

                    // Event.
                    const event = Field.decode(state).events[Field.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdNoParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values).to.be.empty;
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with required parameters on the provided Field', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqParams,
                                field: fieldId,
                                values: valuesReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Field.
                    state = context._state[fieldAddress];

                    expect(state).to.not.be.null;
                    expect(Field.decode(state).events.length).to.equal(3);

                    // Event.
                    const event = Field.decode(state).events[Field.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with no required parameters on the provided Field', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdNoReqParams,
                                field: fieldId,
                                values: valuesNoReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Field.
                    state = context._state[fieldAddress];

                    expect(state).to.not.be.null;
                    expect(Field.decode(state).events.length).to.equal(4);

                    // Event.
                    const event = Field.decode(state).events[Field.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdNoReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesNoReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with either required and no required parameters on the provided Field', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqAndNoReqParams,
                                field: fieldId,
                                values: valuesReqAndNoReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Field.
                    state = context._state[fieldAddress];

                    expect(state).to.not.be.null;
                    expect(Field.decode(state).events.length).to.equal(5);

                    // Event.
                    const event = Field.decode(state).events[Field.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdReqAndNoReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesReqAndNoReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });
            });

            describe('Create Description Event on Batch', async function () {
                it('Should reject if provided batch is not a Company Batch', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: Date.now(),
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqParams,
                                batch: "no-batch"
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if the batch Product Type doesn\'t match one of the enabled Product Types for the Event Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: Date.now(),
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: "event3",
                                batch: batchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should create an Event with no parameters on the provided Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdNoParams,
                                batch: batchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Batch.
                    state = context._state[batchAddress];

                    expect(state).to.not.be.null;
                    expect(Batch.decode(state).events.length).to.equal(1);

                    // Event.
                    const event = Batch.decode(state).events[Batch.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdNoParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values).to.be.empty;
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with required parameters on the provided Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqParams,
                                batch: batchId,
                                values: valuesReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Batch.
                    state = context._state[batchAddress];

                    expect(state).to.not.be.null;
                    expect(Batch.decode(state).events.length).to.equal(2);

                    // Event.
                    const event = Batch.decode(state).events[Batch.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with no required parameters on the provided Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdNoReqParams,
                                batch: batchId,
                                values: valuesNoReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Batch.
                    state = context._state[batchAddress];

                    expect(state).to.not.be.null;
                    expect(Batch.decode(state).events.length).to.equal(3);

                    // Event.
                    const event = Batch.decode(state).events[Batch.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdNoReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesNoReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });

                it('Should create an Event with either required and no required parameters on the provided Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                            timestamp: timestamp,
                            createDescriptionEvent: CreateDescriptionEventAction.create({
                                eventTypeId: eventTypeIdReqAndNoReqParams,
                                batch: batchId,
                                values: valuesReqAndNoReqParams
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    await handler.apply(txn, context);

                    // Batch.
                    state = context._state[batchAddress];

                    expect(state).to.not.be.null;
                    expect(Batch.decode(state).events.length).to.equal(4);

                    // Event.
                    const event = Batch.decode(state).events[Batch.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeIdReqAndNoReqParams);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values.length).to.equal(valuesReqAndNoReqParams.length);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
                });
            });
        });

        describe('Transformation Event', async function () {
            const eventTypeId = "event7";
            const eventTypeIdDesc = "event1";
            const fields = [fieldId];
            const quantities = [1000];
            const derivedProduct = "prd2";
            const outputBatchId = "batch2";
            const conversionRate = 0.7;

            let outputBatchAddress = null;

            before(async function () {
                // Create a new Field.
                await mockCreateField(
                    context,
                    handler,
                    cmpAdminKeyPair.privateKey,
                    "field2",
                    "desc2",
                    "prd2",
                    100,
                    Location.create({
                        latitude: 39.23054,
                        longitude: 9.11917
                    })
                );

                // Batch Address.
                outputBatchAddress = getBatchAddress(outputBatchId, companyId);
            });

            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction);
            });

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now()
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no Event Type id is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({})
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if a list of Batch or a list of Field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if both a list of Batch or a list of Field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            batches: ["no-batch"]
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if a list of quantities is not given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if derived product is not given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            quantities: quantities
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if output batch identifier is not given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            quantities: quantities,
                            derivedProduct: derivedProduct
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided value for eventTypeId doesn\'t match a valid Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: "no-event",
                            fields: fields,
                            quantities: quantities,
                            derivedProduct: derivedProduct,
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );


                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the provided Event Type identifier doesn\'t match a transformation Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeIdDesc,
                            fields: fields,
                            quantities: quantities,
                            derivedProduct: derivedProduct,
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if the Operator\'s task is not a valid enabled Task Type for the provided Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: "event8",
                            fields: fields,
                            quantities: quantities,
                            derivedProduct: derivedProduct,
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if derived product doesn\'t match one of the derived Product Types for the Event Type', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            quantities: quantities,
                            derivedProduct: "prd1",
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if at least one of the given quantities less or equal to zero', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            quantities: [1, 2, 3, 0, 4, 5],
                            derivedProduct: derivedProduct,
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if at least one of the given quantities is greater than current quantity of the Batch or Field to be subtracted', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                        timestamp: Date.now(),
                        createTransformationEvent: CreateTransformationEventAction.create({
                            eventTypeId: eventTypeId,
                            fields: fields,
                            quantities: [1000000],
                            derivedProduct: derivedProduct,
                            outputBatchId: outputBatchId
                        })
                    }),
                    optKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            describe('Create Transformation Event on Field', async function () {
                it('Should reject if at least one of the provided values for fields doesn\'t match a Company Field', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                fields: ["no-field"],
                                quantities: quantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: outputBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if at least a provided field doesn\'t match other Field\'s Product Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                fields: [fieldId, "field2"],
                                quantities: quantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: outputBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if the fields Product Type doesn\'t match one of the enabled Product Types for the Event Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: "event9",
                                fields: fields,
                                quantities: quantities,
                                derivedProduct: derivedProduct
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should create a transformation Event on the provided fields that creates the output Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: timestamp,
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                fields: fields,
                                quantities: quantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: outputBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    state = context._state[fieldAddress];
                    const previousQuantity = Field.decode(state).quantity;

                    await handler.apply(txn, context);

                    // Field.
                    state = context._state[fieldAddress];

                    expect(state).to.not.be.null;
                    expect(Field.decode(state).events.length).to.equal(6);
                    expect(Field.decode(state).quantity).to.equal(previousQuantity - quantities[0]);

                    // Event.
                    const event = Field.decode(state).events[Field.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeId);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values).to.be.empty;
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));

                    // Batch.
                    state = context._state[outputBatchAddress];

                    expect(state).not.to.be.null;
                    expect(Batch.decode(state).id).to.equal(outputBatchId);
                    expect(Batch.decode(state).quantity).to.equal(quantities[0] * conversionRate);
                    expect(Batch.decode(state).parentFields.length).to.equal(1);
                    expect(Batch.decode(state).parentBatches).to.be.empty;
                    expect(Batch.decode(state).events).to.be.empty;
                    expect(Batch.decode(state).finalized).to.equal(false);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));

                    // Company.
                    state = context._state[companyAddress];
                    expect(state).not.to.be.null;
                    expect(Company.decode(state).batches.length).to.equal(2);
                });

                it('Should reject if there is a Batch already associated to given output batch identifier into the Company', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                fields: fields,
                                quantities: quantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: outputBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });
            });

            describe('Create Transformation Event on Batch', async function () {
                const eventTypeId = "event9";
                const newBatchId = "batch4";
                const newQuantities = [20];
                const batches = ["batch1"];
                const derivedProduct = "prd1";
                const conversionRate = 0.8;

                before(async function () {
                    // Create a Batch with a different Product Type.
                    await mockCreateTransformationEvent(
                        context,
                        handler,
                        optKeyPair.privateKey,
                        "event9",
                        [],
                        ["field2"],
                        [100],
                        "prd1",
                        "batch3"
                    );

                    // Output Batch Address.
                    outputBatchAddress = getBatchAddress(newBatchId, companyId);
                });

                it('Should reject if at least one of the provided values for batches doesn\'t match a Company Batch', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                batches: ["no-batch"],
                                quantities: newQuantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: newBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if at least a provided batch doesn\'t match other Batch\'s Product Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                batches: [batchId, "batch10"],
                                quantities: newQuantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: newBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should reject if the batches Product Type doesn\'t match one of the enabled Product Types for the Event Type', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: "event9",
                                batches: batches,
                                quantities: newQuantities,
                                derivedProduct: derivedProduct
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });

                it('Should create a transformation Event on the provided batches that creates a new output Batch', async function () {
                    const timestamp = Date.now();

                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: timestamp,
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                batches: batches,
                                quantities: newQuantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: newBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    state = context._state[batchAddress];
                    const previousQuantity = Batch.decode(state).quantity;

                    await handler.apply(txn, context);

                    // Batch.
                    state = context._state[batchAddress];

                    expect(state).to.not.be.null;
                    expect(Batch.decode(state).events.length).to.equal(5);
                    expect(Batch.decode(state).quantity).to.equal(previousQuantity - newQuantities[0]);

                    // Event.
                    const event = Batch.decode(state).events[Batch.decode(state).events.length - 1];

                    expect(event.eventTypeId).to.equal(eventTypeId);
                    expect(event.reporter).to.equal(optKeyPair.publicKey);
                    expect(event.values).to.be.empty;
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));

                    // Batch.
                    state = context._state[outputBatchAddress];

                    expect(state).not.to.be.null;
                    expect(Batch.decode(state).id).to.equal(newBatchId);
                    expect(Batch.decode(state).company).to.equal(companyId);
                    expect(Batch.decode(state).quantity).to.equal(newQuantities[0] * conversionRate);
                    expect(Batch.decode(state).parentFields).to.be.empty;
                    expect(Batch.decode(state).parentBatches.length).to.equal(1);
                    expect(Batch.decode(state).events).to.be.empty;
                    expect(Batch.decode(state).finalized).to.equal(false);
                    expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));

                    // Company.
                    state = context._state[companyAddress];
                    expect(state).not.to.be.null;
                    expect(Company.decode(state).batches.length).to.equal(4);

                });

                it('Should reject if there is a Batch already associated to given output batch identifier into the Company', async function () {
                    txn = new Txn(
                        SCPayload.create({
                            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
                            timestamp: Date.now(),
                            createTransformationEvent: CreateTransformationEventAction.create({
                                eventTypeId: eventTypeId,
                                batches: batches,
                                quantities: newQuantities,
                                derivedProduct: derivedProduct,
                                outputBatchId: outputBatchId
                            })
                        }),
                        optKeyPair.privateKey
                    );

                    const submission = handler.apply(txn, context);

                    return expect(submission).to.be.rejectedWith(InvalidTransaction)
                });
            });
        });
    });
});
