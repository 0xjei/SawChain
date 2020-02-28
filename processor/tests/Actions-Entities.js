'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    mockCreateSystemAdmin,
    mockCreateOperator,
    populateStateWithMockData
} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    CompanyAdmin,
    Operator,
    Company,
    Field,
    Event,
    Location,
    CreateCompanyAction,
    CreateFieldAction,
    CreateDescriptionEvent
} = require('../services/proto');
const {
    getCompanyAdminAddress,
    getOperatorAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress
} = require('../services/addressing');
const {
    getSHA512,
    getNewKeyPair
} = require('../services/utils');

describe('Entities Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    let sysAdminKeyPair = null;
    let cmpAdminKeyPair = null;

    let companyId = null;
    let companyAddress = null;

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
    });

    describe('Create Company', async function () {
        let name = "mock-companyName";
        let description = "mock-companyDescription";
        let website = "mock-companyWebsite";

        let companyAdminAddress = null;

        before(async function () {
            companyAdminAddress = getCompanyAdminAddress(cmpAdminKeyPair.publicKey)
        });

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });


        it('Should reject if no description is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no website is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no public key is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if public key is public key field doesn\'t contains a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey.slice(0, 65)
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given public key match with the System Admin one', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: sysAdminKeyPair.publicKey
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Company and Company Admin', async function () {
            let timestamp = Date.now();

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: timestamp,
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            await handler.apply(txn, context);

            // Company.
            state = context._state[companyAddress];

            expect(state).to.not.be.null;
            expect(Company.decode(state).id).to.equal(companyId);
            expect(Company.decode(state).name).to.equal(name);
            expect(Company.decode(state).description).to.equal(description);
            expect(Company.decode(state).website).to.equal(website);
            expect(parseInt(Company.decode(state).timestamp)).to.equal(timestamp);
            expect(Company.decode(state).adminPublicKey).to.equal(cmpAdminKeyPair.publicKey);
            expect(Company.decode(state).operators).to.be.empty;
            expect(Company.decode(state).fields).to.be.empty;
            expect(Company.decode(state).batches).to.be.empty;

            // Company Admin.
            state = context._state[companyAdminAddress];

            expect(state).to.not.be.null;
            expect(CompanyAdmin.decode(state).publicKey).to.equal(cmpAdminKeyPair.publicKey);
            expect(CompanyAdmin.decode(state).company).to.equal(companyId);
            expect(parseInt(CompanyAdmin.decode(state).timestamp)).to.equal(timestamp);
        });

        it('Should reject if there is a user already associated to given public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

    });

    describe('Create Field', async function () {
        const id = "field1";
        const description = "desc1";
        const product = "prd1";
        const productQuantity = 150000;
        const location = Location.create({
            latitude: 39.23054,
            longitude: 9.11917
        });

        let fieldAddress = null;

        before(async function () {
            fieldAddress = getFieldAddress(id, companyId);
        });

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no product is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no location is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: product,
                        quantity: productQuantity
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the Company Admin', async function () {
            txn = new Txn(
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
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if the provided value for product doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: "error",
                        quantity: productQuantity,
                        location: location
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given quantity is lower than or equal to zero', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: product,
                        quantity: 0,
                        location: location
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Field', async function () {
            txn = new Txn(
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
                cmpAdminKeyPair.privateKey
            );

            await handler.apply(txn, context);

            // Field.
            state = context._state[fieldAddress];

            expect(state).to.not.be.null;
            expect(Field.decode(state).id).to.equal(id);
            expect(Field.decode(state).description).to.equal(description);
            expect(Field.decode(state).company).to.equal(companyId);
            expect(Field.decode(state).product).to.equal(product);
            expect(Field.decode(state).quantity).to.equal(productQuantity);
            expect(parseInt(Field.decode(state).location.latitude)).to.equal(parseInt(location.latitude.toString()));
            expect(parseInt(Field.decode(state).location.longitude)).to.equal(parseInt(location.longitude.toString()));
            expect(Field.decode(state).events).to.be.empty;

            // Company.
            state = context._state[companyAddress];

            expect(state).to.not.be.null;
            expect(Company.decode(state).fields.length).to.equal(1);
        });

        it('Should reject if there is already a Field with the provided id into the Company', async function () {
            txn = new Txn(
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
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

    });

    describe('Create Description Event', async function () {
        const eventTypeIdReqParams = "event1";
        const eventTypeIdNoParams = "event6";
        const eventTypeIdNoReqParams = "event2";
        const eventTypeIdReqAndNoReqParams = "event7";
        const field = "field1";
        const batch = "batch1";

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

        let fieldAddress = null;
        let batchAddress = null;

        let optTask = "task1";
        let optKeyPair = null;
        let operatorAddress = null;

        before(async function () {
            // Create a new key pair for an Operator.
            optKeyPair = getNewKeyPair();
            operatorAddress = getOperatorAddress(optKeyPair.publicKey);

            // Field and Batch addresses.
            fieldAddress = getFieldAddress(field, companyId);
            batchAddress = getBatchAddress(field, companyId);

            // Record the Operator for the Company.
            await mockCreateOperator(context, handler, cmpAdminKeyPair.privateKey, optKeyPair.publicKey, optTask);
        });

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
                    createDescriptionEvent: CreateDescriptionEvent.create({})
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
                        batch: batch
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided field is not a Company Field', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                    timestamp: Date.now(),
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: "no-field"
                    })
                }),
                optKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided batch is not a Company Batch', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                    timestamp: Date.now(),
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        batch: "no-batch"
                    })
                }),
                optKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if the provided value for eventTypeId doesn\'t match a valid Event Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                    timestamp: Date.now(),
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: "no-event-type-id",
                        field: field
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: "event5",
                        field: field
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: "event4",
                        field: field
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: "event3",
                        field: field
                    })
                }),
                optKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        // todo after batch definition.
        // it('Should reject if the batch Product Type doesn\'t match one of the enabled Product Types for the Event Type', async function () {
        //     txn = new Txn(
        //         SCPayload.create({
        //             action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
        //             timestamp: Date.now(),
        //             createDescriptionEvent: CreateDescriptionEvent.create({
        //                 eventTypeId: ?,
        //                 batch: ?
        //             })
        //         }),
        //         optKeyPair.privateKey
        //     );
        //
        //     const submission = handler.apply(txn, context);
        //     console.log(await submission)
        //     return expect(submission).to.be.rejectedWith(InvalidTransaction)
        // });

        it('Should reject if the Event Type has at least one EventParameter required but no values are given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                    timestamp: Date.now(),
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
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

        it('Should create an Event with no parameters on the provided Field', async function () {
            const timestamp = Date.now();

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
                    timestamp: timestamp,
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdNoParams,
                        field: field
                    })
                }),
                optKeyPair.privateKey
            );

            await handler.apply(txn, context);

            // Field.
            state = context._state[fieldAddress];

            expect(state).to.not.be.null;
            expect(Field.decode(state).events.length).to.equal(1);

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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqParams,
                        field: field,
                        values: valuesReqParams
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdNoReqParams,
                        field: field,
                        values: valuesNoReqParams
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
                    createDescriptionEvent: CreateDescriptionEvent.create({
                        eventTypeId: eventTypeIdReqAndNoReqParams,
                        field: field,
                        values: valuesReqAndNoReqParams
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

            expect(event.eventTypeId).to.equal(eventTypeIdReqAndNoReqParams);
            expect(event.reporter).to.equal(optKeyPair.publicKey);
            expect(event.values.length).to.equal(valuesReqAndNoReqParams.length);
            expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp));
        });

        // todo add same tests for batch
    });
});