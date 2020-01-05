'use strict'

const { expect } = require('chai')
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')

const AgriChainHandler = require('./services/handler_wrapper')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')

const { ACPayload } = require('../services/proto')

describe('Core Handler Behavior', () => {
  let handler = null
  let context = null

  before(() => {
    handler = new AgriChainHandler()
  })

  beforeEach(() => {
    context = new Context()
  })

  it('Should return a Promise', () => {
    const txn = new Txn({ action: 'NO_ACTION' })
    const applyResult = handler.apply(txn, context)

    expect(applyResult).to.be.an.instanceOf(Promise)
    applyResult.catch(() => {})
  })

  it('Should reject poorly encoded payloads', async () => {
    const txn = new Txn(ACPayload.create({ action: 'NO_ACTION' }))
    const rejected = await handler.apply(txn, context).catch(error => {
      expect(error).to.be.instanceOf(InvalidTransaction)
      return true
    })

    expect(rejected).to.be.true
  })
})
