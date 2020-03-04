'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    mockCreateSystemAdmin,
    populateStateWithMockData
} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    CompanyAdmin,
    Company,
    Field,
    Location,
    CreateCompanyAction,
    CreateFieldAction
} = require('../services/proto');
const {
    getCompanyAdminAddress,
    getCompanyAddress,
    getFieldAddress,
} = require('../services/addressing');
const {
    getSHA512,
    getNewKeyPair
} = require('../services/utils');

describe('Entities Company Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    const enabledProductTypes = ["prd1", "prd2", "prd3"];

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

        it('Should reject if no enabled product types list is given', async function () {
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


        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey,
                        enabledProductTypes: enabledProductTypes
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
                        admin: sysAdminKeyPair.publicKey,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided Product Types values for enable product types doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: cmpAdminKeyPair.publicKey,
                        enabledProductTypes: ["prd0"]
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
                        admin: cmpAdminKeyPair.publicKey,
                        enabledProductTypes: enabledProductTypes
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
            expect(Company.decode(state).enabledProductTypes.length).to.equal(enabledProductTypes.length);
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
                        admin: cmpAdminKeyPair.publicKey,
                        enabledProductTypes: enabledProductTypes
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
        const product = "prd3";
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

        it('Should reject the provided Product Type value for product doesn\'t match an enabled Company Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: "prd4",
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
});