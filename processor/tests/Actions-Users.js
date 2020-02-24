'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    SCPayload,
    SCPayloadActions,
    SystemAdmin,
    UpdateSystemAdminAction
} = require('../services/proto');
const {getSystemAdminAddress} = require('../services/addressing');
const {getNewKeyPair} = require('../services/utils');

describe('Users Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    before(function () {
        handler = new SawChainHandler();
        context = new Context();
    });

    describe('System Admin Actions', function () {
        // System admin key pair.
        let adminPrivateKey = null;
        let adminPublicKey = null;

        const systemAdminAddress = getSystemAdminAddress();

        describe('Create System Admin', function () {
            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should create the System Admin', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN,
                        timestamp: Date.now()
                    })
                );
                // Retrieve System Admin key pair.
                adminPrivateKey = txn._privateKey;
                adminPublicKey = txn._publicKey;

                // Send and execute txn.
                await handler.apply(txn, context);

                // Get state information from address.
                state = context._state[systemAdminAddress];

                expect(state).to.not.be.null;
                expect(SystemAdmin.decode(state).publicKey).to.equal(adminPublicKey)
            });

            it('Should reject if System Admin is already recorded', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_SYSADMIN,
                        timestamp: Date.now()
                    })
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
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        updateSysAdmin: UpdateSystemAdminAction.create({})
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now()
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no public key is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({})
                    })
                );
                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if public key is not valid', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey.slice(0, 65)
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if public key is the same as System Admin public key', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({
                            publicKey: adminPublicKey
                        })
                    })
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if current System Admin is not the transaction signer', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey
                        })
                    }),
                    newAdminKeys.privateKey
                );

                const submission = handler.apply(txn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should update the System Admin', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({
                            publicKey: newAdminKeys.publicKey
                        })
                    }),
                    adminPrivateKey
                );

                await handler.apply(txn, context);

                state = context._state[systemAdminAddress];

                expect(state).to.not.be.null;
                expect(SystemAdmin.decode(state).publicKey).to.equal(newAdminKeys.publicKey)
            });

        });
    });

});
