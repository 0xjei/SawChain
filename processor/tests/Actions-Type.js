'use_strict'

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const { expect } = require('chai')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')
const SawChainHandler = require('./services/handler_wrapper')
const { mockCreateSystemAdmin, mockCreateProductType } = require('./services/mock_entities')
const {
  SCPayload,
  SCPayloadActions,
  TaskType,
  ProductType,
  EventParameterType,
  EventType,
  PropertyType,
  Shared,
  CreateTaskTypeAction,
  CreateProductTypeAction,
  CreateEventParameterTypeAction,
  CreateEventTypeAction,
  CreatePropertyTypeAction,
  DataType,
} = require('../services/proto')
const {
  getTaskTypeAddress,
  getProductTypeAddress,
  getEventParameterTypeAddress,
  getEventTypeAddress,
  getPropertyTypeAddress,
} = require('../services/addressing')
const { createNewKeyPair } = require('./services/mock_utils')

describe('Type Actions', function () {
  let handler = null
  let context = null

  let txn = null
  let state = null
  let decodedState = null
  let submission = null

  let systemAdminKeyPair = null
  let invalidSignerKeyPair = null

  // Types identifiers.
  const taskTypeId = 'TKT1'
  const productTypeId1 = 'PDT1'
  const productTypeId2 = 'PDT2'
  const eventParameterTypeId = 'EPT1'
  const eventTypeId1 = 'EVT1'
  const eventTypeId2 = 'EVT2'
  const eventTypeId3 = 'EVT3'
  const propertyTypeId = 'PRT1'

  // Invalid addresses for testing purpose.
  let invalidTaskTypeAddress = null
  let invalidProductTypeAddress = null
  let invalidEventParameterAddress = null

  before(async function () {
    // Create a new SawChain Handler and state Context objects.
    handler = new SawChainHandler()
    context = new Context()

    // Create the System Admin.
    systemAdminKeyPair = createNewKeyPair()
    await mockCreateSystemAdmin(context, handler, systemAdminKeyPair.privateKey)

    // Create invalid data for testing purpose.
    invalidSignerKeyPair = createNewKeyPair()
    invalidTaskTypeAddress = getTaskTypeAddress('TKT0')
    invalidProductTypeAddress = getProductTypeAddress('PDT0')
    invalidEventParameterAddress = getEventParameterTypeAddress('EPT0')
  })

  describe('Create Task Type', function () {
    // Mock data.
    const task = 'task1'
    let taskTypeAddress = null

    before(async function () {
      // Get Task Type state address.
      taskTypeAddress = getTaskTypeAddress(taskTypeId)
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
          createTaskType: CreateTaskTypeAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no task specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
          createTaskType: CreateTaskTypeAction.create({
            id: taskTypeId,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not the System Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
          createTaskType: CreateTaskTypeAction.create({
            id: taskTypeId,
            task: task,
          }),
        }),
        invalidSignerKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create the Task Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
          createTaskType: CreateTaskTypeAction.create({
            id: taskTypeId,
            task: task,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[taskTypeAddress]
      decodedState = TaskType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(taskTypeId)
      expect(decodedState.task).to.equal(task)
    })

    it('Should reject if the id belongs to another Task Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_TASK_TYPE,
          timestamp: Date.now(),
          createTaskType: CreateTaskTypeAction.create({
            id: taskTypeId,
            task: task,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })

  describe('Create Product Type', function () {
    // Mock data.
    const name1 = 'name1'
    const description1 = 'description1'
    const measure1 = Shared.UnitOfMeasure.KILOS

    const name2 = 'name2'
    const description2 = 'description2'
    const measure2 = Shared.UnitOfMeasure.LITRE

    let productTypeAddress1 = null
    let productTypeAddress2 = null
    let derivedProductTypes = null

    before(async function () {
      // Get Product Type state addresses.
      productTypeAddress1 = getProductTypeAddress(productTypeId1)
      productTypeAddress2 = getProductTypeAddress(productTypeId2)

      // Create derived Product Types for the second Product Type.
      derivedProductTypes = [
        ProductType.DerivedProductType.create({
          productTypeAddress: productTypeAddress1,
          conversionRate: 0.7,
        }),
      ]
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no name specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if measure doesn\'t match one any possible value', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId1,
            name: name1,
            measure: -1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not the System Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId1,
            name: name1,
            description: description1,
            measure: measure1,
          }),
        }),
        invalidSignerKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create a Product Type with no derived Product Types', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId1,
            name: name1,
            description: description1,
            measure: measure1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[productTypeAddress1]
      decodedState = ProductType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(productTypeId1)
      expect(decodedState.name).to.equal(name1)
      expect(decodedState.description).to.equal(description1)
      expect(decodedState.measure).to.equal(measure1)
      expect(decodedState.derivedProductTypes).to.be.empty
    })

    it('Should reject if at least one derived Product Type state address is not a valid Product Type address', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId2,
            name: name2,
            description: description2,
            measure: measure2,
            derivedProductTypes: [
              ProductType.DerivedProductType.create({
                productTypeAddress: productTypeAddress1.slice(0, 30),
              }),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified derived Product Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId2,
            name: name2,
            description: description2,
            measure: measure2,
            derivedProductTypes: [
              ProductType.DerivedProductType.create({
                productTypeAddress: invalidProductTypeAddress,
              }),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified derived Product Type doesn\'t have a conversion rate greater than zero', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId2,
            name: name2,
            description: description2,
            measure: measure2,
            derivedProductTypes: [
              ProductType.DerivedProductType.create({
                productTypeAddress: productTypeAddress1,
                conversionRate: 0,
              }),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create a Product Type with derived Product Types', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId2,
            name: name2,
            description: description2,
            measure: measure2,
            derivedProductTypes: derivedProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[productTypeAddress2]
      decodedState = ProductType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(productTypeId2)
      expect(decodedState.name).to.equal(name2)
      expect(decodedState.description).to.equal(description2)
      expect(decodedState.measure).to.equal(measure2)
      expect(decodedState.derivedProductTypes.length).to.equal(derivedProductTypes.length)
      expect(decodedState.derivedProductTypes[0].productTypeAddress).to.equal(derivedProductTypes[0].productTypeAddress)
      expect(decodedState.derivedProductTypes[0].conversionRate).to.equal(derivedProductTypes[0].conversionRate)
    })

    it('Should reject if the id belongs to another Product Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PRODUCT_TYPE,
          timestamp: Date.now(),
          createProductType: CreateProductTypeAction.create({
            id: productTypeId2,
            name: name2,
            description: description2,
            measure: measure2,
            derivedProductTypes: derivedProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })

  describe('Create Event Parameter Type', function () {
    // Mock data.
    const name = 'name1'
    const dataType = Shared.DataType.STRING

    let eventParameterTypeAddress = null

    before(async function () {
      // Get Event Parameter Type state addresses.
      eventParameterTypeAddress = getEventParameterTypeAddress(eventParameterTypeId)
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no name specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({
            id: eventParameterTypeId,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if dataType doesn\'t match one any possible value', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({
            id: eventParameterTypeId,
            name: name,
            dataType: 10,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not the System Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({
            id: eventParameterTypeId,
            name: name,
            dataType: dataType,
          }),
        }),
        invalidSignerKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create the Event Parameter Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({
            id: eventParameterTypeId,
            name: name,
            dataType: dataType,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[eventParameterTypeAddress]
      decodedState = EventParameterType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(eventParameterTypeId)
      expect(decodedState.name).to.equal(name)
      expect(decodedState.dataType).to.equal(dataType)
    })

    it('Should reject if the id belongs to another Event Parameter Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
          timestamp: Date.now(),
          createEventParameterType: CreateEventParameterTypeAction.create({
            id: eventParameterTypeId,
            name: name,
            dataType: dataType,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })

  describe('Create Event Type', function () {
    // Mock data.
    const name1 = 'name1'
    const description1 = 'description1'

    const name2 = 'name2'
    const description2 = 'description2'

    const name3 = 'name3'
    const description3 = 'description3'

    const transformationTypology = EventType.Typology.TRANSFORMATION
    const descriptionTypology = EventType.Typology.DESCRIPTION

    let eventTypeAddress1 = null
    let eventTypeAddress2 = null
    let eventTypeAddress3 = null
    let productTypeAddress = null
    let parameters = null
    let enabledTaskTypes = null
    let enabledProductTypes = null
    let enabledDerivedProductTypes = null

    before(async function () {
      // Create another Product Type.
      await mockCreateProductType(context, handler, systemAdminKeyPair.privateKey, 'PDT3', 'name3', 'description3', 0, [])
      productTypeAddress = getProductTypeAddress('PDT3')

      // Get Event Type state addresses.
      eventTypeAddress1 = getEventTypeAddress(eventTypeId1)
      eventTypeAddress2 = getEventTypeAddress(eventTypeId2)
      eventTypeAddress3 = getEventTypeAddress(eventTypeId3)

      // Create lists.
      enabledTaskTypes = [
        getTaskTypeAddress(taskTypeId),
      ]

      enabledProductTypes = [
        getProductTypeAddress(productTypeId2),
      ]

      parameters = [
        EventType.Parameter.create({
          eventParameterTypeAddress: getEventParameterTypeAddress(eventParameterTypeId),
          required: true,
          minLength: 10,
          maxLength: 80,
        }),
      ]

      enabledDerivedProductTypes = [
        getProductTypeAddress(productTypeId1),
      ]
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if typology doesn\'t match one any possible value', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: -1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no name specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no description is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if signer is not the System Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
          }),
        }),
        invalidSignerKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Task Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            enabledTaskTypes: [
              eventTypeAddress1.slice(0, 30),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Task Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            enabledTaskTypes: [
              eventTypeAddress1,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Product Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: [
              eventTypeAddress1.slice(0, 30),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Product Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            parameters: parameters,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: [
              invalidProductTypeAddress,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create the Event Type with no parameters', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[eventTypeAddress1]
      decodedState = EventType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(eventTypeId1)
      expect(decodedState.typology).to.equal(descriptionTypology)
      expect(decodedState.name).to.equal(name1)
      expect(decodedState.description).to.equal(description1)
      expect(decodedState.parameters).to.be.empty
      expect(decodedState.enabledTaskTypes.length).to.be.equal(1)
      expect(decodedState.enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0])
      expect(decodedState.enabledProductTypes.length).to.be.equal(1)
      expect(decodedState.enabledProductTypes[0]).to.be.equal(enabledProductTypes[0])
    })

    it('Should reject if at least one Event Parameter Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId2,
            typology: descriptionTypology,
            name: name2,
            description: description2,
            parameters:
                            [
                              EventType.Parameter.create({
                                eventParameterTypeAddress: eventTypeAddress2.slice(0, 30),
                                required: true,
                              }),
                            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Event Parameter Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId2,
            typology: descriptionTypology,
            name: name2,
            description: description2,
            parameters:
                            [
                              EventType.Parameter.create({
                                eventParameterTypeAddress: invalidEventParameterAddress,
                              }),
                            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create a description Event Type with parameters', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId2,
            typology: descriptionTypology,
            name: name2,
            description: description2,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
            parameters: parameters,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[eventTypeAddress2]
      decodedState = EventType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(eventTypeId2)
      expect(decodedState.typology).to.equal(descriptionTypology)
      expect(decodedState.name).to.equal(name2)
      expect(decodedState.description).to.equal(description2)
      expect(decodedState.enabledTaskTypes.length).to.be.equal(1)
      expect(decodedState.enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0])
      expect(decodedState.enabledProductTypes.length).to.be.equal(1)
      expect(decodedState.enabledProductTypes[0]).to.be.equal(enabledProductTypes[0])
      expect(decodedState.parameters.length).to.be.equal(1)
      expect(decodedState.parameters[0].eventParameterTypeAddress).to.be.equal(parameters[0].eventParameterTypeAddress)
      expect(decodedState.parameters[0].required).to.be.equal(parameters[0].required)
      expect(decodedState.parameters[0].minLength).to.be.equal(parameters[0].minLength)
      expect(decodedState.parameters[0].maxLength).to.be.equal(parameters[0].maxLength)
    })

    it('Should reject if at least one derived Product Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId3,
            typology: transformationTypology,
            name: name3,
            description: description3,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
            parameters: parameters,
            enabledDerivedProductTypes: [
              eventTypeAddress1.slice(0, 30),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified derived Product Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId3,
            typology: transformationTypology,
            name: name3,
            description: description3,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
            parameters: parameters,
            enabledDerivedProductTypes: [
              invalidProductTypeAddress,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one derived Product Type doesn\'t match a valid derived product for enabled Product Types', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId3,
            typology: transformationTypology,
            name: name3,
            description: description3,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
            parameters: parameters,
            enabledDerivedProductTypes: [
              productTypeAddress,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create a transformation Event Type with parameters', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId3,
            typology: transformationTypology,
            name: name3,
            description: description3,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
            parameters: parameters,
            enabledDerivedProductTypes: enabledDerivedProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[eventTypeAddress3]
      decodedState = EventType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(eventTypeId3)
      expect(decodedState.typology).to.equal(transformationTypology)
      expect(decodedState.name).to.equal(name3)
      expect(decodedState.description).to.equal(description3)
      expect(decodedState.enabledTaskTypes.length).to.be.equal(1)
      expect(decodedState.enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0])
      expect(decodedState.enabledProductTypes.length).to.be.equal(1)
      expect(decodedState.enabledProductTypes[0]).to.be.equal(enabledProductTypes[0])
      expect(decodedState.parameters.length).to.be.equal(1)
      expect(decodedState.parameters[0].eventParameterTypeAddress).to.be.equal(parameters[0].eventParameterTypeAddress)
      expect(decodedState.parameters[0].required).to.be.equal(parameters[0].required)
      expect(decodedState.parameters[0].minLength).to.be.equal(parameters[0].minLength)
      expect(decodedState.parameters[0].maxLength).to.be.equal(parameters[0].maxLength)
      expect(decodedState.enabledDerivedProductTypes.length).to.be.equal(1)
      expect(decodedState.enabledDerivedProductTypes[0]).to.be.equal(enabledDerivedProductTypes[0])
    })

    it('Should reject if the id belongs to another Event Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_EVENT_TYPE,
          timestamp: Date.now(),
          createEventType: CreateEventTypeAction.create({
            id: eventTypeId1,
            typology: descriptionTypology,
            name: name1,
            description: description1,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })

  describe('Create Property Type', function () {
    const name = 'name1'
    const dataType = Shared.DataType.LOCATION

    let propertyTypeAddress = null
    let enabledTaskTypes = null
    let enabledProductTypes = null

    before(async function () {
      // Get Property Type state addresses.
      propertyTypeAddress = getPropertyTypeAddress(propertyTypeId)

      // Create lists.
      enabledTaskTypes = [
        getTaskTypeAddress(taskTypeId),
      ]

      enabledProductTypes = [
        getProductTypeAddress(productTypeId1),
      ]
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no name specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if data type doesn\'t match one any possible value', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: -1,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not the System Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
          }),
        }),
        invalidSignerKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Task Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: [
              invalidTaskTypeAddress.slice(0, 30),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Task Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: [
              invalidTaskTypeAddress,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one Product Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: [
              invalidProductTypeAddress.slice(0, 30),
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Product Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: [
              invalidProductTypeAddress,
            ],
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create the Property Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      state = context._state[propertyTypeAddress]
      decodedState = PropertyType.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(propertyTypeId)
      expect(decodedState.name).to.equal(name)
      expect(decodedState.dataType).to.equal(dataType)
      expect(decodedState.enabledTaskTypes.length).to.be.equal(1)
      expect(decodedState.enabledTaskTypes[0]).to.be.equal(enabledTaskTypes[0])
      expect(decodedState.enabledProductTypes.length).to.be.equal(1)
      expect(decodedState.enabledProductTypes[0]).to.be.equal(enabledProductTypes[0])
    })

    it('Should reject if the id belongs to another Property Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_PROPERTY_TYPE,
          timestamp: Date.now(),
          createPropertyType: CreatePropertyTypeAction.create({
            id: propertyTypeId,
            name: name,
            dataType: dataType,
            enabledTaskTypes: enabledTaskTypes,
            enabledProductTypes: enabledProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })
})
