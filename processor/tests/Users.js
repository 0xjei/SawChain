'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const {ACPayload, SystemAdmin, UpdateSystemAdminAction} = require('../services/proto');
const AgriChainHandler = require('./services/handler_wrapper');
const {getSystemAdminAddress} = require('../services/addressing');
const secp256k1 = require('sawtooth-sdk/signing/secp256k1');
const secp256k1Context = new secp256k1.Secp256k1Context();

describe('Users Functionalities', () => {
    describe('System Admin', () => {
        let handler = null;
        let context = null;
        let txn = null;
        let publicKey = null;
        let privateKey = null;
        let address = null;

        before(function () {
            handler = new AgriChainHandler();
            context = new Context();
            txn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
            );
            publicKey = txn._publicKey;
            privateKey = txn._privateKey;
            address = getSystemAdminAddress(publicKey);
        });
        describe('Create System Admin', () => {

            it('Should reject if no timestamp is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN})
                );

                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should create the System Admin', async () => {
                await handler.apply(txn, context);

                expect(context._state[address]).to.exist;
                expect(SystemAdmin.decode(context._state[address]).publicKey).to.equal(
                    publicKey
                )
            });

            it('Should reject if System Admin is already recorded', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
                );

                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });
        });

        const newAdminPrivateKey = secp256k1Context.newRandomPrivateKey();
        const newAdminPublicKey = secp256k1Context.getPublicKey(newAdminPrivateKey).asHex();
        let updateTxn = null;

        before(function () {
            updateTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.UPDATE_SYSADMIN,
                    timestamp: Date.now(),
                    updateSysAdmin: UpdateSystemAdminAction.create({publicKey: newAdminPublicKey})
                }),
                privateKey
            );
        });

        describe('Update System Admin', () => {
            it('Should reject if no timestamp is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.UPDATE_SYSADMIN})
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if no public key is given', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({action: ACPayload.Action.UPDATE_SYSADMIN, timestamp: Date.now()})
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if public key is invalid', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: publicKey.slice(0, 65)})
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
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: publicKey})
                    }),
                    privateKey
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should reject if current System Admin is not the transaction signer', async () => {
                invalidTxn = new Txn(
                    ACPayload.create({
                        action: ACPayload.Action.UPDATE_SYSADMIN,
                        timestamp: Date.now(),
                        updateSysAdmin: UpdateSystemAdminAction.create({publicKey: publicKey})
                    }),
                    secp256k1Context.newRandomPrivateKey().asHex()
                );
                const submission = handler.apply(invalidTxn, context);

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            });

            it('Should update the System Admin', async () => {
                await handler.apply(updateTxn, context);

                expect(context._state[address]).to.exist;
                expect(SystemAdmin.decode(context._state[address]).publicKey).to.equal(
                    newAdminPublicKey
                )
            });

        });

    });
});
