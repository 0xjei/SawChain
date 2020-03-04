'use strict'

const {TransactionProcessor} = require('sawtooth-sdk/processor')
const SawChainHandler = require('./handler')

// Bind SawChain TP to Validator node.
const tp = new TransactionProcessor(process.env.VALIDATOR_URL || 'tcp://localhost:4004')

// Record SawChain TP Handler.
const handler = new SawChainHandler()
tp.addHandler(handler)

// TP startup.
tp.start()
