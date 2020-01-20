'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const {ACPayload, SystemAdmin, UpdateSystemAdminAction} = require('../services/proto');
const AgriChainHandler = require('./services/handler_wrapper');
const {getSystemAdminAddress} = require('../services/addressing');
const {getNewKeyPair} = require('../services/utils');

describe('Users Functionalities', () => {
    describe('System Admin', () => {
        const handler = new AgriChainHandler();
        const context = new Context();

        let adminPrivateKey = null;
        let adminPublicKey = null;
        let newAdminKeys = null;

        const systemAdminAddress = getSystemAdminAddress();

        describe('Create System Admin', () => {

            it('Should reject if no timestamp is given', async () => {
                const invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN})
                );

                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should create the System Admin', async () => {
                const txn = new Txn(
                    ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
                );
                adminPrivateKey = txn._privateKey;
                adminPublicKey = txn._publicKey;

                await handler.apply(txn, context);

                expect(context._state[systemAdminAddress]).to.not.be.null;
                expect(SystemAdmin.decode(context._state[systemAdminAddress]).publicKey).to.equal(
                    adminPublicKey
                )
            });

            it('Should reject if System Admin is already recorded', async () => {
                const invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
                );

                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });
        });

        before(function () {
            newAdminKeys = getNewKeyPair();
        });
        describe('Update System Admin', () => {

            it('Should reject if no action payload is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.UPDATE_SYSADMIN})
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no timestamp is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        updateSysAdmin: UpdateSystemAdminAction.create({error: "error"})
                    })
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no public key is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({error: "error"})
                    })
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if public key is invalid', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: newAdminKeys.publicKey.slice(0, 65)})
                    })
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if same current System Admin public key is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: adminPublicKey})
                    }),
                    adminPrivateKey
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if current System Admin is not the transaction signer', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: newAdminKeys.publicKey})
                    }),
                    newAdminKeys.privateKey
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should update the System Admin', async () => {
                const updateTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: newAdminKeys.publicKey})
                    }),
                    adminPrivateKey
                );

                await handler.apply(updateTxn, context);

                expect(context._state[systemAdminAddress]).to.not.be.null;
                expect(SystemAdmin.decode(context._state[systemAdminAddress]).publicKey).to.equal(
                    newAdminKeys.publicKey
                )
            });

        });

    });
});
