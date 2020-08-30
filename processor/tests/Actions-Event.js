'use_strict'

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const { expect } = require('chai')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')
const SawChainHandler = require('./services/handler_wrapper')
const {
  mockCreateSystemAdmin,
  mockCreateOperator,
  mockCreateField,
  mockCreateCompany,
  mockCreateTransformationEvent,
  mockFinalizeBatch,
  populateStateWithMockData,
} = require('./services/mock_entities')
const {
  SCPayload,
  SCPayloadActions,
  Company,
  Field,
  Event,
  Batch,
  Shared,
  CreateDescriptionEventAction,
  CreateTransformationEventAction,
} = require('../services/proto')
const {
  getTaskTypeAddress,
  getProductTypeAddress,
  getEventParameterTypeAddress,
  getEventTypeAddress,
  getOperatorAddress,
  getCompanyAdminAddress,
  getCompanyAddress,
  getFieldAddress,
  getBatchAddress,
  hashAndSlice,
} = require('../services/addressing')
const { createNewKeyPair } = require('./services/mock_utils')

describe('Event Actions', function () {
  let handler = null
  let context = null

  let txn = null
  let state = null
  let decodedState = null
  let submission = null

  let systemAdminKeyPair = null
  let companyAdminKeyPair = null
  let operatorKeyPair = null

  // Company and Field identifiers.
  let companyId = null
  const fieldId = 'FDL1'

  // Addresses.
  let companyAdminAddress = null
  let operatorAddress = null
  let companyAddress = null
  let fieldAddress = null

  // Invalid addresses for testing purpose.
  let invalidTaskTypeAddress = null
  let invalidProductTypeAddress = null
  let invalidEventParameterAddress = null
  let invalidEventTypeAddress = null
  let invalidFieldAddress = null
  let invalidBatchAddress = null

  before(async function () {
    // Create a new SawChain Handler and state Context objects.
    handler = new SawChainHandler()
    context = new Context()

    // Create the System Admin.
    systemAdminKeyPair = createNewKeyPair()
    await mockCreateSystemAdmin(context, handler, systemAdminKeyPair.privateKey)

    // Populate the state with mock types data.
    await populateStateWithMockData(context, handler, systemAdminKeyPair.privateKey)

    // Company Admin key pair.
    companyAdminKeyPair = createNewKeyPair()
    companyAdminAddress = getCompanyAdminAddress(companyAdminKeyPair.publicKey)

    // Calculate Company id from Company Admin's public key.
    companyId = hashAndSlice(companyAdminKeyPair.publicKey, 10)

    // Get Company and Field addresses.
    companyAddress = getCompanyAddress(companyId)
    fieldAddress = getFieldAddress(fieldId, companyId)

    // Create Company and Field.
    await mockCreateCompany(
      context, handler, systemAdminKeyPair.privateKey,
      'name1', 'description1', 'website1',
      companyAdminKeyPair.publicKey,
      [
        getProductTypeAddress('PDT2'),
        getProductTypeAddress('PDT3'),
        getProductTypeAddress('PDT4'),
      ],
    )

    await mockCreateField(
      context, handler, companyAdminKeyPair.privateKey,
      fieldId, 'description1', getProductTypeAddress('PDT3'), 15000,
      Shared.Location.create({ latitude: 39.23054, longitude: 9.11917 }),
    )

    // Create an Operator.
    operatorKeyPair = createNewKeyPair()
    operatorAddress = getOperatorAddress(operatorKeyPair.publicKey)

    await mockCreateOperator(
      context, handler, companyAdminKeyPair.privateKey, operatorKeyPair.publicKey, getTaskTypeAddress('TKT1'),
    )

    // Create invalid data for testing purpose.
    invalidTaskTypeAddress = getTaskTypeAddress('TKT0')
    invalidProductTypeAddress = getProductTypeAddress('PDT0')
    invalidEventParameterAddress = getEventParameterTypeAddress('EPT0')
    invalidEventTypeAddress = getEventTypeAddress('EVT0')
    invalidFieldAddress = getFieldAddress('FDL0', companyId)
    invalidBatchAddress = getBatchAddress('BTC0')
  })

  describe('Create Description Event', async function () {
    // Mock data.
    let eventTypeTransformation = null
    let eventTypeDiffTask = null
    let eventTypeDiffProduct = null
    let eventTypeReqParam = null
    let eventTypeNoReqParam = null
    let parameterValues = null

    before(async function () {
      eventTypeTransformation = getEventTypeAddress('EVT8')
      eventTypeDiffTask = getEventTypeAddress('EVT4')
      eventTypeDiffProduct = getEventTypeAddress('EVT3')
      eventTypeReqParam = getEventTypeAddress('EVT1')
      eventTypeNoReqParam = getEventTypeAddress('EVT2')

      parameterValues = [
        Event.ParameterValue.create({
          parameterType: getEventParameterTypeAddress('EPT1'),
          numberValue: 99,
        }),
        Event.ParameterValue.create({
          parameterType: getEventParameterTypeAddress('EPT2'),
          stringValue: 'recorded',
        }),
      ]
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no Batch or Field specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({}),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if either Batch and Field specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            batch: invalidBatchAddress,
            field: fieldAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not an Operator', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Event Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: invalidEventTypeAddress.slice(0, 30),
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Event Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: invalidEventTypeAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the Event Type is not a description Event Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeTransformation,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the Operator task doesn\'t match an Event Type enabled task', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeDiffTask,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no values specified for required Parameters', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeReqParam,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the value is lower than the Parameter minimum value constraint', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeReqParam,
            values: [
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT1'),
                numberValue: 9,
              }),
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT2'),
                stringValue: 'no',
              }),
            ],
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the value is greater than the Parameter maximum value constraint', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeReqParam,
            values: [
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT1'),
                numberValue: 101,
              }),
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT2'),
                stringValue: 'no',
              }),
            ],
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the value length is lower than the Parameter minimum length constraint', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeReqParam,
            values: [
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT1'),
                numberValue: 99,
              }),
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT2'),
                stringValue: 'no',
              }),
            ],
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the value length is greater than the Parameter maximum length constraint', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
          timestamp: Date.now(),
          createDescriptionEvent: CreateDescriptionEventAction.create({
            field: fieldAddress,
            eventType: eventTypeReqParam,
            values: [
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT1'),
                numberValue: 99,
              }),
              Event.ParameterValue.create({
                parameterType: getEventParameterTypeAddress('EPT2'),
                stringValue: 'thisstringistoolong',
              }),
            ],
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    describe('Field', async function () {
      it('Should reject if the field doesn\'t match a Company Field', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
              field: invalidFieldAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if the Field product doesn\'t match an Event Type enabled product', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
              field: fieldAddress,
              eventType: eventTypeDiffProduct,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should create an Event with no required parameters', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: timestamp,
            createDescriptionEvent: CreateDescriptionEventAction.create({
              field: fieldAddress,
              eventType: eventTypeNoReqParam,
              values: [],
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Field.
        state = context._state[fieldAddress]
        decodedState = Field.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(1)

        // Event.
        const event = decodedState.events[0]

        expect(event.eventType).to.equal(eventTypeNoReqParam)
        expect(event.reporter).to.equal(operatorKeyPair.publicKey)
        expect(event.values).to.be.empty
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))
      })

      it('Should create an Event with required parameters', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: timestamp,
            createDescriptionEvent: CreateDescriptionEventAction.create({
              field: fieldAddress,
              eventType: eventTypeReqParam,
              values: parameterValues,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Field.
        state = context._state[fieldAddress]
        decodedState = Field.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(2)

        // Event.
        const event = decodedState.events[1]

        expect(event.eventType).to.equal(eventTypeReqParam)
        expect(event.reporter).to.equal(operatorKeyPair.publicKey)
        expect(event.values.length).to.equal(parameterValues.length)
        expect(event.values[0].parameterType).to.equal(parameterValues[0].parameterType)
        expect(event.values[0].numberValue).to.equal(parameterValues[0].numberValue)
        expect(event.values[1].parameterType).to.equal(parameterValues[1].parameterType)
        expect(event.values[1].stringValue).to.equal(parameterValues[1].stringValue)
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))
      })
    })

    describe('Batch', async function () {
      const firstBatchId = 'BTC1'
      const finalizedBatchId = 'BTC2'

      let firstBatchAddress = null
      let invalidBatchAddress = null
      let finalizedBatchAddress = null

      before(async function () {
        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair.privateKey, getEventTypeAddress('EVT8'),
          [], [fieldAddress], [100], getProductTypeAddress('PDT2'),
          firstBatchId,
        )
        firstBatchAddress = getBatchAddress(firstBatchId)

        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair.privateKey, getEventTypeAddress('EVT8'),
          [], [fieldAddress], [100], getProductTypeAddress('PDT2'),
          finalizedBatchId,
        )
        finalizedBatchAddress = getBatchAddress(finalizedBatchId)

        await mockFinalizeBatch(
          context, handler, operatorKeyPair.privateKey,
          finalizedBatchAddress, Batch.Finalization.Reason.WITHDRAWN, '',
        )

        // Change
        eventTypeDiffProduct = getEventTypeAddress('EVT7')

        // Create invalid data for testing purpose.
        invalidBatchAddress = getBatchAddress('BTC0')
      })

      it('Should reject if the batch doesn\'t match a Company Batch', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
              batch: invalidBatchAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if the Batch product doesn\'t match an Event Type enabled product', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
              batch: firstBatchAddress,
              eventType: eventTypeDiffProduct,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if the Batch is finalized', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
              batch: finalizedBatchAddress,
              eventType: eventTypeReqParam,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should create an Event with no required parameters', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: timestamp,
            createDescriptionEvent: CreateDescriptionEventAction.create({
              batch: firstBatchAddress,
              eventType: eventTypeNoReqParam,
              values: [],
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Field.
        state = context._state[firstBatchAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(1)

        // Event.
        const event = decodedState.events[0]

        expect(event.eventType).to.equal(eventTypeNoReqParam)
        expect(event.reporter).to.equal(operatorKeyPair.publicKey)
        expect(event.values).to.be.empty
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))
      })

      it('Should create an Event with required parameters', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
            timestamp: timestamp,
            createDescriptionEvent: CreateDescriptionEventAction.create({
              batch: firstBatchAddress,
              eventType: eventTypeReqParam,
              values: parameterValues,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Field.
        state = context._state[firstBatchAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(2)

        // Event.
        const event = decodedState.events[1]

        expect(event.eventType).to.equal(eventTypeReqParam)
        expect(event.reporter).to.equal(operatorKeyPair.publicKey)
        expect(event.values.length).to.equal(parameterValues.length)
        expect(event.values[0].parameterType).to.equal(parameterValues[0].parameterType)
        expect(event.values[0].numberValue).to.equal(parameterValues[0].numberValue)
        expect(event.values[1].parameterType).to.equal(parameterValues[1].parameterType)
        expect(event.values[1].stringValue).to.equal(parameterValues[1].stringValue)
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))
      })
    })
  })

  describe('Transformation Event', async function () {
    // Mock data.
    const quantities = [1000]
    const conversionRate = 0.7
    const outputBatchId = 'BTC3'
    const fieldIdDiffProd = 'FLD2'
    const fieldIdDiffDeriv = 'FLD3'

    let outputBatchAddress = null
    let derivedProduct = null
    let wrongDerivedProduct = null

    let eventTypeDescription = null
    let eventTypeDiffTask = null
    let eventTypeDiffProduct = null
    let eventTypeDiffDerived = null
    let eventTypeToRecord = null
    let fieldDiffProdAddress = null
    let fieldDiffDerivAddress = null

    before(async function () {
      outputBatchAddress = getBatchAddress(outputBatchId)

      eventTypeDescription = getEventTypeAddress('EVT1')
      eventTypeDiffTask = getEventTypeAddress('EVT9')
      eventTypeToRecord = getEventTypeAddress('EVT8')
      eventTypeDiffProduct = getEventTypeAddress('EVT11')
      eventTypeDiffDerived = getEventTypeAddress('EVT12')

      derivedProduct = getProductTypeAddress('PDT2')
      wrongDerivedProduct = getProductTypeAddress('PDT1')

      // Create a new Field for testing purpose.
      await mockCreateField(
        context, handler, companyAdminKeyPair.privateKey,
        fieldIdDiffProd, 'description',
        getProductTypeAddress('PDT4'), 15000,
        Shared.Location.create({ latitude: 39.23054, longitude: 9.11917 }),
      )

      await mockCreateField(
        context, handler, companyAdminKeyPair.privateKey,
        fieldIdDiffDeriv, 'description',
        getProductTypeAddress('PDT2'), 15000,
        Shared.Location.create({ latitude: 39.23054, longitude: 9.11917 }),
      )

      fieldDiffProdAddress = getFieldAddress(fieldIdDiffProd, companyId)
      fieldDiffDerivAddress = getFieldAddress(fieldIdDiffDeriv, companyId)
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no Batch or Field specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({}),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if either Batch and Field specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            batches: [invalidBatchAddress],
            fields: [fieldAddress],
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no quantities list specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no output batch id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not an Operator', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Event Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: invalidEventTypeAddress.slice(0, 30),
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Event Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: invalidEventTypeAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the Event Type is not a transformation Event Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: eventTypeDescription,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the Operator task doesn\'t match an Event Type enabled task', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: eventTypeDiffTask,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if derived Product Type doesn\'t match a derived Event Type enabled product', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: eventTypeToRecord,
            derivedProduct: wrongDerivedProduct,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if derived Product Type doesn\'t match a Company enabled product', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldDiffDerivAddress],
            quantities: quantities,
            outputBatchId: outputBatchId,
            eventType: eventTypeDiffDerived,
            derivedProduct: wrongDerivedProduct,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one quantity is not greater than zero', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
          timestamp: Date.now(),
          createTransformationEvent: CreateTransformationEventAction.create({
            fields: [fieldAddress],
            quantities: [0],
            outputBatchId: outputBatchId,
            eventType: eventTypeToRecord,
            derivedProduct: derivedProduct,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    describe('Field', async function () {
      it('Should reject if at least one Field state address is not a Company Field', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              fields: [invalidFieldAddress],
              quantities: quantities,
              outputBatchId: outputBatchId,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least a field doesn\'t match other Field\'s product Product Type', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              fields: [fieldAddress, fieldDiffProdAddress],
              quantities: quantities,
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if fields Product Type doesn\'t match an Event Type enabled product', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              fields: [fieldAddress],
              quantities: quantities,
              outputBatchId: outputBatchId,
              eventType: eventTypeDiffProduct,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if quantities length doesn\'t match fields length', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              fields: [fieldAddress],
              quantities: [10, 20],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
              derivedProduct: derivedProduct,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if a quantity is greater than current Field quantity', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              fields: [fieldAddress],
              quantities: [20000],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
              derivedProduct: derivedProduct,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should create a transformation Event on fields and create the output Batch for the Company', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: timestamp,
            createTransformationEvent: CreateTransformationEventAction.create({
              eventType: eventTypeToRecord,
              fields: [fieldAddress],
              quantities: quantities,
              derivedProduct: derivedProduct,
              outputBatchId: outputBatchId,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        state = context._state[fieldAddress]
        decodedState = Field.decode(state)

        const previousQuantity = decodedState.quantity
        const previousEventsLength = decodedState.events.length

        await handler.apply(txn, context)

        // Field.
        state = context._state[fieldAddress]
        decodedState = Field.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(previousEventsLength + 1)
        expect(decodedState.quantity).to.equal(previousQuantity - quantities[0])

        // Event.
        const event = decodedState.events[decodedState.events.length - 1]

        expect(event.eventType).to.equal(eventTypeToRecord)
        expect(event.reporter).to.equal(operatorKeyPair.publicKey)
        expect(event.values).to.be.empty
        expect(event.quantity).to.equal(quantities[0])
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))

        // Batch.
        state = context._state[outputBatchAddress]
        decodedState = Batch.decode(state)

        expect(state).not.to.be.null
        expect(decodedState.id).to.equal(outputBatchId)
        expect(decodedState.company).to.equal(companyAddress)
        expect(decodedState.quantity).to.equal(quantities[0] * conversionRate)
        expect(decodedState.parentFields.length).to.equal(1)
        expect(decodedState.parentFields[0]).to.equal(fieldAddress)
        expect(decodedState.parentBatches).to.be.empty
        expect(decodedState.events).to.be.empty

        // Company.
        state = context._state[companyAddress]
        decodedState = Company.decode(state)

        expect(state).not.to.be.null
        expect(decodedState.batches.length).to.equal(3)
        expect(decodedState.batches[2]).to.equal(outputBatchAddress)
      })

      it('Should reject if output batch id is already used for another Company Batch', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              eventType: eventTypeToRecord,
              fields: [fieldAddress],
              quantities: quantities,
              derivedProduct: derivedProduct,
              outputBatchId: outputBatchId,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })
    })

    describe('Batch', async function () {
      // Mock data.
      const outputBatchId = 'BTC4'
      const batchIdProd2 = 'BTC1'
      const batchIdProd1 = 'BTC2'
      const finalizedBatchId = 'BTC5'
      const quantities = [10]
      const conversionRate = 0.8

      let companyAdminKeyPair2 = null
      let operatorKeyPair2 = null

      let outputBatchAddress = null
      let companyAddress2 = null
      let batchProd2Address = null
      let batchProd1Address = null
      let finalizedBatchAddress = null
      let derivedProduct = null

      before(async function () {
        // Update output Batch address.
        outputBatchAddress = getBatchAddress(outputBatchId)

        // Update Event Type to record.
        eventTypeToRecord = getEventTypeAddress('EVT12')
        derivedProduct = getProductTypeAddress('PDT1')

        // Get Company Admin and Operator key pairs.
        companyAdminKeyPair2 = createNewKeyPair()
        operatorKeyPair2 = createNewKeyPair()

        // Create another Company, Field, and Operator.
        await mockCreateCompany(
          context, handler, systemAdminKeyPair.privateKey,
          'name2', 'description2', 'website2',
          companyAdminKeyPair2.publicKey,
          [
            getProductTypeAddress('PDT1'),
            getProductTypeAddress('PDT2'),
            getProductTypeAddress('PDT3'),
            getProductTypeAddress('PDT4'),
          ],
        )
        companyAddress2 = getCompanyAddress(hashAndSlice(companyAdminKeyPair2.publicKey, 10))

        await mockCreateField(
          context, handler, companyAdminKeyPair2.privateKey,
          fieldId, 'description', getProductTypeAddress('PDT3'), 15000,
          Shared.Location.create({ latitude: 39.23054, longitude: 9.11917 }),
        )

        await mockCreateOperator(
          context, handler, companyAdminKeyPair2.privateKey,
          operatorKeyPair2.publicKey, getTaskTypeAddress('TKT1'),
        )

        // Transform the Field in order to create a Batch with PDT2 product.
        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair2.privateKey,
          getEventTypeAddress('EVT8'), [],
          [getFieldAddress(fieldId, hashAndSlice(companyAdminKeyPair2.publicKey, 10))],
          [1000], getProductTypeAddress('PDT2'),
          batchIdProd2,
        )
        batchProd2Address = getBatchAddress(batchIdProd2)

        // Transform the Batch in order to create a Batch with PDT1 product.
        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair2.privateKey,
          getEventTypeAddress('EVT12'), [batchProd2Address],
          [],
          [100], derivedProduct,
          batchIdProd1,
        )
        batchProd1Address = getBatchAddress(batchIdProd1)

        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair2.privateKey, getEventTypeAddress('EVT8'),
          [], [getFieldAddress(fieldId, hashAndSlice(companyAdminKeyPair2.publicKey, 10))],
          [100], getProductTypeAddress('PDT2'),
          finalizedBatchId,
        )
        finalizedBatchAddress = getBatchAddress(finalizedBatchId)

        await mockFinalizeBatch(
          context, handler, operatorKeyPair2.privateKey,
          finalizedBatchAddress, Batch.Finalization.Reason.WITHDRAWN, '',
        )
      })

      it('Should reject if at least one Batch state address is not a Company Batch', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [invalidBatchAddress],
              quantities: quantities,
              outputBatchId: outputBatchId,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least a batch doesn\'t match other Batch\'s product Product Type', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [batchProd2Address, batchProd1Address],
              quantities: [10, 10],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least a Batch is finalized', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [finalizedBatchAddress],
              quantities: [10],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if batch Product Type doesn\'t match an Event Type enabled product', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [batchProd1Address],
              quantities: quantities,
              outputBatchId: outputBatchId,
              eventType: eventTypeDiffProduct,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if quantities length doesn\'t match batches length', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [batchProd2Address],
              quantities: [10, 10],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
              derivedProduct: derivedProduct,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if a quantity is greater than current Batch quantity', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [batchProd2Address],
              quantities: [10000],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
              derivedProduct: derivedProduct,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should create a transformation Event on batches and create the output Batch for the Company', async function () {
        const timestamp = Date.now()

        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
            timestamp: timestamp,
            createTransformationEvent: CreateTransformationEventAction.create({
              batches: [batchProd2Address],
              quantities: [10],
              outputBatchId: outputBatchId,
              eventType: eventTypeToRecord,
              derivedProduct: derivedProduct,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        state = context._state[batchProd2Address]
        decodedState = Batch.decode(state)

        const previousQuantity = decodedState.quantity
        const previousEventsLength = decodedState.events.length

        await handler.apply(txn, context)

        // Field.
        state = context._state[batchProd2Address]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.events.length).to.equal(previousEventsLength + 1)
        expect(decodedState.quantity).to.equal(previousQuantity - quantities[0])

        // Event.
        const event = decodedState.events[decodedState.events.length - 1]

        expect(event.eventType).to.equal(eventTypeToRecord)
        expect(event.reporter).to.equal(operatorKeyPair2.publicKey)
        expect(event.values).to.be.empty
        expect(event.quantity).to.equal(quantities[0])
        expect(parseInt(event.timestamp)).to.equal(parseInt(timestamp))

        // Batch.
        state = context._state[outputBatchAddress]
        decodedState = Batch.decode(state)

        expect(state).not.to.be.null
        expect(decodedState.id).to.equal(outputBatchId)
        expect(decodedState.company).to.equal(companyAddress2)
        expect(decodedState.quantity).to.equal(quantities[0] * conversionRate)
        expect(decodedState.parentFields).to.be.empty
        expect(decodedState.parentBatches.length).to.equal(1)
        expect(decodedState.parentBatches[0]).to.equal(batchProd2Address)
        expect(decodedState.events).to.be.empty

        // Company.
        state = context._state[companyAddress2]
        decodedState = Company.decode(state)

        expect(state).not.to.be.null
        expect(decodedState.batches.length).to.equal(4)
        expect(decodedState.batches[3]).to.equal(outputBatchAddress)
      })
    })
  })
})
