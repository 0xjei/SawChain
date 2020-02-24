'use strict';

const {TransactionProcessor} = require('sawtooth-sdk/processor');
const SawChainHandler = require('./handler');

// Bind SawChain TP to Validator.
const tp = new TransactionProcessor(process.env.VALIDATOR_URL || 'tcp://localhost:4004');

// Handler recording.
const handler = new SawChainHandler();
tp.addHandler(handler);

// Transaction Processor (tp) start.
tp.start();
