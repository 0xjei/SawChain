'use strict';

const {TransactionProcessor} = require('sawtooth-sdk/processor');

const AgriChainHandler = require('./handler');

const tp = new TransactionProcessor(process.env.VALIDATOR_URL || 'tcp://localhost:4004');
const handler = new AgriChainHandler();

// Add the handler and start the transaction processor.
tp.addHandler(handler);
tp.start();
