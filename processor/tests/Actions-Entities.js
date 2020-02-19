'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const AgriChainHandler = require('./services/handler_wrapper');
const {
    mockCreateSystemAdmin,
    bootstrapSystem
} = require('./services/mock_entities');
const {
    ACPayload,
    ACPayloadActions,
    CompanyAdmin,
    Operator,
    Company,
    Field,
    Location,
    CreateCompanyAction,
    CreateFieldAction,
    CreateOperatorAction
} = require('../services/proto');
const {
    getCompanyAdminAddress,
    getOperatorAddress,
    getCompanyAddress,
    getFieldAddress
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

    let keyPairSA = null;
    let keyPairCA = null;
    let keyPairOP1 = null;

    let company = null;
    let companyAddress = null;

    before(async function () {
        handler = new AgriChainHandler();
        context = new Context();

        // Bootstrap System Admin and Types.
        keyPairSA = await mockCreateSystemAdmin(context, handler);
        await bootstrapSystem(context, handler, keyPairSA.privateKey);

        // Company Admin key pair.
        keyPairCA = getNewKeyPair();
        company = getSHA512(keyPairCA.publicKey, 10);
        companyAddress = getCompanyAddress(getSHA512(keyPairCA.publicKey, 10));
        // Operator key pair.
        keyPairOP1 = getNewKeyPair();
    });

    describe('Create Company', async function () {
        let id = null;
        let name = "mock-companyName";
        let description = "mock-companyDescription";
        let website = "mock-companyWebsite";

        let companyAdminAddress = null;

        before(async function () {
            id = getSHA512(keyPairCA.publicKey, 10);

            companyAdminAddress = getCompanyAdminAddress(keyPairCA.publicKey)
        });

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    createCompany: CreateCompanyAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });


        it('Should reject if no description is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
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
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
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

        it('Should reject if no company admin public key is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
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

        it('Should reject if company admin public key is not valid', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: keyPairCA.publicKey.slice(0, 65)
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if current System Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: keyPairCA.publicKey
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given company admin public key is equal to system admin public key', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: keyPairSA.publicKey
                    })
                }),
                keyPairSA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Company and Company Admin', async function () {
            let timestamp = Date.now();

            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: timestamp,
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: keyPairCA.publicKey
                    })
                }),
                keyPairSA.privateKey
            );

            await handler.apply(txn, context);

            // Company.
            state = context._state[companyAddress];

            expect(state).to.not.be.null;
            expect(Company.decode(state).id).to.equal(id);
            expect(Company.decode(state).name).to.equal(name);
            expect(Company.decode(state).description).to.equal(description);
            expect(Company.decode(state).website).to.equal(website);
            expect(parseInt(Company.decode(state).timestamp)).to.equal(timestamp);
            expect(Company.decode(state).adminPublicKey).to.equal(keyPairCA.publicKey);
            expect(Company.decode(state).operators).to.be.empty;
            expect(Company.decode(state).fields).to.be.empty;
            expect(Company.decode(state).batches).to.be.empty;

            // Company Admin.
            state = context._state[companyAdminAddress];

            expect(state).to.not.be.null;
            expect(CompanyAdmin.decode(state).publicKey).to.equal(keyPairCA.publicKey);
            expect(CompanyAdmin.decode(state).company).to.equal(id);
            expect(parseInt(CompanyAdmin.decode(state).timestamp)).to.equal(timestamp);
        });

        it('Should reject if given company admin public key is already associated to a company admin', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_COMPANY,
                    timestamp: Date.now(),
                    createCompany: CreateCompanyAction.create({
                        name: name,
                        description: description,
                        website: website,
                        admin: keyPairCA.publicKey
                    })
                }),
                keyPairSA.privateKey
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
            fieldAddress = getFieldAddress(id);
            companyAddress = getCompanyAddress(company)
        });

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    createField: CreateFieldAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
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
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
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
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
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

        it('Should reject if a Company Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
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

        it('Should reject if given product type is not recorded yet', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: "error",
                        quantity: productQuantity,
                        location: location
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given quantity is lower than or equal to zero', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: product,
                        quantity: 0,
                        location: location
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Field', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: product,
                        quantity: productQuantity,
                        location: location
                    })
                }),
                keyPairCA.privateKey
            );

            await handler.apply(txn, context);

            // Field.
            state = context._state[fieldAddress];

            expect(state).to.not.be.null;
            expect(Field.decode(state).id).to.equal(id);
            expect(Field.decode(state).description).to.equal(description);
            expect(Field.decode(state).company).to.equal(company);
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

        it('Should reject if given id is already associated to a field inside given company', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_FIELD,
                    timestamp: Date.now(),
                    createField: CreateFieldAction.create({
                        id: id,
                        description: description,
                        product: product,
                        quantity: productQuantity,
                        location: location
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

    });

    describe('Create Operator', async function () {
        const task = "task1";

        let publicKey = null;
        let operatorAddress = null;

        before(async function () {
            publicKey = keyPairOP1.publicKey;

            operatorAddress = getOperatorAddress(publicKey);
        });


        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    createOperator: CreateOperatorAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no task is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no operator public key is given', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if operator public key is not valid', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey.slice(0, 30)
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if a Company Admin is not the transaction signer', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey,
                        task: task
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given operator public key is already associated to a company admin', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: keyPairCA.publicKey,
                        task: task
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given task is not recorded', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey,
                        task: "error"
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Operator', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey,
                        task: task
                    })
                }),
                keyPairCA.privateKey
            );

            await handler.apply(txn, context);

            // Field.
            state = context._state[operatorAddress];

            expect(state).to.not.be.null;
            expect(Operator.decode(state).publicKey).to.equal(publicKey);
            expect(Operator.decode(state).company).to.equal(company);
            expect(Operator.decode(state).task).to.equal(task);

            // Company.
            state = context._state[companyAddress];

            expect(state).to.not.be.null;
            expect(Company.decode(state).operators.length).to.equal(1);
        });

        it('Should reject if given operator public key is already associated to a operator', async function () {
            txn = new Txn(
                ACPayload.create({
                    action: ACPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: publicKey,
                        task: task
                    })
                }),
                keyPairCA.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

    });
});