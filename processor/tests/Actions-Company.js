'use_strict'

const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const { expect } = require('chai')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')
const SawChainHandler = require('./services/handler_wrapper')
const {
  mockCreateSystemAdmin,
  populateStateWithMockData,
} = require('./services/mock_entities')
const {
  SCPayload,
  SCPayloadActions,
  CompanyAdmin,
  Company,
  Field,
  Shared,
  CreateCompanyAction,
  CreateFieldAction,
} = require('../services/proto')
const {
  getProductTypeAddress,
  getCompanyAdminAddress,
  getCompanyAddress,
  getFieldAddress,
  hashAndSlice,
  getTaskTypeAddress,
  getEventParameterTypeAddress,
} = require('../services/addressing')
const { createNewKeyPair } = require('./services/mock_utils')

describe('Company Actions', function () {
  let handler = null
  let context = null

  let txn = null
  let state = null
  let decodedState = null
  let submission = null

  let systemAdminKeyPair = null
  let companyAdminKeyPair = null

  // Company and Field identifiers.
  let companyId = null
  const fieldId = 'FDL1'

  // Company and Field addresses.
  let companyAddress = null
  let fieldAddress = null
  let companyAdminAddress = null

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

    // Create invalid data for testing purpose.
    invalidTaskTypeAddress = getTaskTypeAddress('TKT0')
    invalidProductTypeAddress = getProductTypeAddress('PDT0')
    invalidEventParameterAddress = getEventParameterTypeAddress('EPT0')
  })

  describe('Create Company', async function () {
    // Mock data.
    const name = 'name1'
    const description = 'description1'
    const website = 'website1'

    let enabledProductTypes = null

    before(async function () {
      // Create Product Type list.
      enabledProductTypes = [
        getProductTypeAddress('PDT1'),
        getProductTypeAddress('PDT2'),
        getProductTypeAddress('PDT3'),
      ]
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no name specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({}),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no description specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no website specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the admin field doesn\'t contain a valid public key', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: companyAdminKeyPair.publicKey.slice(0, 65),
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
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: companyAdminKeyPair.publicKey,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the public key belongs to another authorized user', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: systemAdminKeyPair.publicKey,
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
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: companyAdminKeyPair.publicKey,
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
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: Date.now(),
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: companyAdminKeyPair.publicKey,
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

    it('Should create the Company and Company Admin', async function () {
      const timestamp = Date.now()

      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_COMPANY,
          timestamp: timestamp,
          createCompany: CreateCompanyAction.create({
            name: name,
            description: description,
            website: website,
            admin: companyAdminKeyPair.publicKey,
            enabledProductTypes: enabledProductTypes,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Company.
      state = context._state[companyAddress]
      decodedState = Company.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(companyId)
      expect(decodedState.name).to.equal(name)
      expect(decodedState.description).to.equal(description)
      expect(decodedState.website).to.equal(website)
      expect(decodedState.adminPublicKey).to.equal(companyAdminKeyPair.publicKey)
      expect(decodedState.enabledProductTypes.length).to.equal(enabledProductTypes.length)
      expect(decodedState.enabledProductTypes.length[0]).to.equal(enabledProductTypes.length[0])
      expect(decodedState.enabledProductTypes.length[1]).to.equal(enabledProductTypes.length[1])
      expect(decodedState.enabledProductTypes.length[2]).to.equal(enabledProductTypes.length[2])
      expect(decodedState.operators).to.be.empty
      expect(decodedState.fields).to.be.empty
      expect(decodedState.batches).to.be.empty
      expect(parseInt(decodedState.timestamp)).to.equal(timestamp)

      // Company Admin.
      state = context._state[companyAdminAddress]
      decodedState = CompanyAdmin.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.publicKey).to.equal(companyAdminKeyPair.publicKey)
      expect(decodedState.company).to.equal(companyAddress)
      expect(parseInt(decodedState.timestamp)).to.equal(timestamp)
    })
  })

  describe('Create Field', async function () {
    const description = 'description1'
    const quantity = 150000
    const location = Shared.Location.create({
      latitude: 39.23054,
      longitude: 9.11917,
    })

    let product = null
    let notEnabledProductTypeAddress = null

    before(async function () {
      // Create Product Type.
      product = getProductTypeAddress('PDT3')

      // Not enabled Product Type address.
      notEnabledProductTypeAddress = getProductTypeAddress('PDT4')
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no id is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({}),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no description is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no location is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if transaction signer is not the Company Admin', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
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
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: invalidProductTypeAddress.slice(0, 30),
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least one specified Product Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: invalidProductTypeAddress,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the product field doesn\'t match an enabled Company Product Type address', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: notEnabledProductTypeAddress,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if specified quantity is not greater than zero', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: product,
            quantity: 0,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should create the Field', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: product,
            quantity: quantity,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Field.
      state = context._state[fieldAddress]
      decodedState = Field.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(fieldId)
      expect(decodedState.description).to.equal(description)
      expect(decodedState.company).to.equal(companyAddress)
      expect(decodedState.product).to.equal(product)
      expect(decodedState.quantity).to.equal(quantity)
      expect(parseInt(decodedState.location.latitude)).to.equal(parseInt(location.latitude.toString()))
      expect(parseInt(decodedState.location.longitude)).to.equal(parseInt(location.longitude.toString()))
      expect(decodedState.events).to.be.empty

      // Company.
      state = context._state[companyAddress]
      decodedState = Company.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.fields.length).to.equal(1)
      expect(decodedState.fields[0]).to.equal(fieldAddress)
    })

    it('Should reject if the id belongs to another company Field', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.CREATE_FIELD,
          timestamp: Date.now(),
          createField: CreateFieldAction.create({
            id: fieldId,
            description: description,
            location: location,
            product: product,
            quantity: quantity,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })
})
