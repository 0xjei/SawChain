'use strict';

const {TransactionProcessor} = require('sawtooth-sdk/processor');
const AgriChainHandler = require('./handler');

// Bind to validator.
const tp = new TransactionProcessor(process.env.VALIDATOR_URL || 'tcp://localhost:4004');
const handler = new AgriChainHandler();

// Handler recording.
tp.addHandler(handler);
// Transaction Processor (tp) start.
tp.start();
