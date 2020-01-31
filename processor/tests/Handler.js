'use strict';

const {expect} = require('chai');
const AgriChainHandler = require('./services/handler_wrapper');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {ACPayload} = require('../services/proto');

describe('Core Handler Behavior', function () {
    let handler = null;
    let context = null;

    before(function () {
        handler = new AgriChainHandler()
    });

    beforeEach(function () {
        context = new Context()
    });

    it('Should return a Promise', function () {
        const txn = new Txn({action: 'NO_ACTION'});
        const apply = handler.apply(txn, context);

        return expect(apply).to.be.rejectedWith(InvalidTransaction);
    });

    it('Should reject poorly encoded payloads', async function () {
        const txn = new Txn(ACPayload.create({action: 'NO_ACTION'}));
        const rejected = handler.apply(txn, context);

        return expect(rejected).to.be.rejectedWith(InvalidTransaction);
    })
});
