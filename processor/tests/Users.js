'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const {ACPayload, SystemAdmin} = require('../services/proto');
const AgriChainHandler = require('./services/handler_wrapper');
const {getSystemAdminAddress} = require('../services/addressing');

describe('Users Functionalities', () => {
    describe('Create System Admin', () => {
        let handler = null;
        let context = null;
        let txn = null;
        let publicKey = null;
        let address = null;

        before(function () {
            handler = new AgriChainHandler();
            context = new Context();
            txn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
            );
            publicKey = txn._publicKey;
            address = getSystemAdminAddress(publicKey)
        });

        it('Should reject if no timestamp is given.', async () => {
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

        it('Should reject if System Admin is already recorded.', async () => {
            invalidTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
            );

            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    })
});
