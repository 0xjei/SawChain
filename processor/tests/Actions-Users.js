'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    mockCreateCompany,
    populateStateWithMockData
} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    SystemAdmin,
    Operator,
    CertificationAuthority,
    Company,
    UpdateSystemAdminAction,
    CreateOperatorAction,
    CreateCertificationAuthorityAction
} = require('../services/proto');
const {
    getSystemAdminAddress,
    getOperatorAddress,
    getCompanyAddress,
    getCertificationAuthorityAddress
} = require('../services/addressing');
const {
    getNewKeyPair,
    getSHA512
} = require('../services/utils');

describe('Users Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    // System admin key pair.
    let sysAdminKeyPair = null;

    before(function () {
        handler = new SawChainHandler();
        context = new Context();
    });

    describe('System Admin Actions', function () {

        const systemAdminAddress = getSystemAdminAddress();

        before(function () {
            // Generate System Admin key pair.
            sysAdminKeyPair = getNewKeyPair()
        });

        describe('Create System Admin', function () {
            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should create the System Admin', async function () {
                const timestamp = Date.now();

                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN,
                        timestamp: timestamp
                    }),
                    sysAdminKeyPair.privateKey
                );
                // Send and execute txn.
                await handler.apply(txn, context);

                // Get state information from address.
                state = context._state[systemAdminAddress];

                expect(state).to.not.be.null;
                expect(SystemAdmin.decode(state).publicKey).to.equal(sysAdminKeyPair.publicKey);
                expect(parseInt(SystemAdmin.decode(state).timestamp)).to.equal(timestamp);

            });

            it('Should reject if System Admin is already recorded', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN,
                        timestamp: Date.now()
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });
        });

        describe('Update System Admin', function () {
            let newAdminKeys = null;

            before(function () {
                // Generate new key pair for the new System Admin.
                newAdminKeys = getNewKeyPair();
            });

            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now()
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no public key is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSystemAdmin: UpdateSystemAdminAction.create({})
                    }),
                    sysAdminKeyPair.privateKey
                );
                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if public key is public key field doesn\'t contains a valid public key', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSystemAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey.slice(0, 65)
                        })
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if there is a user already associated to given public key', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSystemAdmin: UpdateSystemAdminAction.create({
                            publicKey: sysAdminKeyPair.publicKey
                        })
                    }),
                    sysAdminKeyPair.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if transaction signer is not the System Admin', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSystemAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey
                        })
                    }),
                    newAdminKeys.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should update the System Admin', async function () {
                const timestamp = Date.now();

                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: timestamp,
                        updateSystemAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey
                        })
                    }),
                    sysAdminKeyPair.privateKey
                );

                // Update System Admin key pair.
                sysAdminKeyPair = newAdminKeys;

                await handler.apply(txn, context);

                state = context._state[systemAdminAddress];

                expect(state).to.not.be.null;
                expect(SystemAdmin.decode(state).publicKey).to.equal(newAdminKeys.publicKey);
                expect(parseInt(SystemAdmin.decode(state).timestamp)).to.equal(timestamp);
            });
        });
    });

    describe('Create Operator Action', async function () {
        const task = "task1";

        let cmpAdminKeyPair = null;
        let optKeyPair = null;

        let companyId = null;
        const companyName = "mock-company-name";
        const companyDescription = "mock-company-description";
        const companyWebsite = "mock-company-website";

        let companyAddress = null;
        let operatorAddress = null;

        before(async function () {
            // Populate the state with mock types.
            await populateStateWithMockData(context, handler, sysAdminKeyPair.privateKey);

            // Company Admin key pair.
            cmpAdminKeyPair = getNewKeyPair();
            companyId = getSHA512(cmpAdminKeyPair.publicKey, 10);
            companyAddress = getCompanyAddress(companyId);

            // Populate the state with a Company.
            await mockCreateCompany(context, handler, sysAdminKeyPair.privateKey, companyName, companyDescription, companyWebsite, cmpAdminKeyPair.publicKey, ["prd1", "prd2", "prd3"]);

            // Operator key pair.
            optKeyPair = getNewKeyPair();
            operatorAddress = getOperatorAddress(optKeyPair.publicKey);
        });


        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now()
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no public key is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({})
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no task is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if public key is public key field doesn\'t contains a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey.slice(0, 30),
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the Company Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if given public key match with a Company Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: cmpAdminKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if the provided value for task doesn\'t match a valid Task Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: "error"
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Operator', async function () {
            const timestamp = Date.now();

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: timestamp,
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            await handler.apply(txn, context);

            // Field.
            state = context._state[operatorAddress];

            expect(state).to.not.be.null;
            expect(Operator.decode(state).publicKey).to.equal(optKeyPair.publicKey);
            expect(Operator.decode(state).company).to.equal(companyId);
            expect(Operator.decode(state).task).to.equal(task);
            expect(parseInt(Operator.decode(state).timestamp)).to.equal(timestamp);

            // Company.
            state = context._state[companyAddress];

            expect(state).to.not.be.null;
            expect(Company.decode(state).operators.length).to.equal(1);
        });

        it('Should reject if there is already an Operator with the provided public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

    describe('Create Certification Authority Action', async function () {
        const caName = "ca1";
        const caWebsite = "website1";
        const products = ["prd1", "prd2"];

        let caKeyPair = null;
        let caAddress = null;

        before(async function () {
            // Certification Authority key pair.
            caKeyPair = getNewKeyPair();
            caAddress = getCertificationAuthorityAddress(caKeyPair.publicKey);
        });

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now()
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no public key is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({})
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no website is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: caName
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no products are given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: caName,
                        website: caWebsite
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if public key is public key field doesn\'t contains a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey.slice(0, 60),
                        name: caName,
                        website: caWebsite,
                        products: products
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if there is a user already associated to given public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: sysAdminKeyPair.publicKey,
                        name: caName,
                        website: caWebsite,
                        products: products
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if transaction signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: caName,
                        website: caWebsite,
                        products: products
                    })
                }),
                caKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if at least one of the provided values for products doesn\'t match a valid Product Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: caName,
                        website: caWebsite,
                        products: ["no-prod"]
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
        it('Should create the Certification Authority', async function () {
            const timestamp = Date.now();

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: timestamp,
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: caName,
                        website: caWebsite,
                        products: products
                    })
                }),
                sysAdminKeyPair.privateKey
            );

            await handler.apply(txn, context);

            state = context._state[caAddress];

            expect(state).to.not.be.null;
            expect(CertificationAuthority.decode(state).publicKey).to.equal(caKeyPair.publicKey);
            expect(CertificationAuthority.decode(state).name).to.equal(caName);
            expect(CertificationAuthority.decode(state).website).to.equal(caWebsite);
            expect(CertificationAuthority.decode(state).products.length).to.equal(products.length);
            expect(parseInt(CertificationAuthority.decode(state).timestamp)).to.equal(timestamp);
        });
    });
});
