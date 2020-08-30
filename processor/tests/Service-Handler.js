
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const { expect } = require('chai')
const SawChainHandler = require('./services/handler_wrapper')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')
const { SCPayload } = require('../services/proto')
const { createNewKeyPair } = require('./services/mock_utils')

describe('Handler Behavior', function () {
  let handler = null
  let context = null

  let txn = null
  let submission = null

  let signerKeyPair = null

  before(function () {
    // Create a new SawChain Handler and state Context objects.
    handler = new SawChainHandler()
    context = new Context()

    signerKeyPair = createNewKeyPair()
  })

  it('Should return an InvalidTransaction error', async function () {
    txn = new Txn(
      {
        action: 'NO_ACTION',
      },
      signerKeyPair.privateKey,
    )

    submission = handler.apply(txn, context)

    return expect(submission).to.be.rejectedWith(InvalidTransaction)
  })

  it('Should reject poorly encoded payloads', async function () {
    txn = new Txn(
      SCPayload.create({
        action: 'NO_ACTION',
      }),
      signerKeyPair.privateKey,
    )

    submission = handler.apply(txn, context)

    return expect(submission).to.be.rejectedWith(InvalidTransaction)
  })
})
