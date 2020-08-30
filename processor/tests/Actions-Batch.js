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
  mockCreateCertificationAuthority,
  mockCreateProposal,
  mockFinalizeBatch,
  populateStateWithMockData,
} = require('./services/mock_entities')
const {
  SCPayload,
  SCPayloadActions,
  Company,
  Batch,
  Shared,
  Proposal,
  AddBatchCertificateAction,
  RecordBatchPropertyAction,
  CreateProposalAction,
  AnswerProposalAction,
  FinalizeBatchAction,
} = require('../services/proto')
const {
  getOperatorAddress,
  getCertificationAuthorityAddress,
  getPropertyTypeAddress,
  getCompanyAddress,
  getProductTypeAddress,
  getTaskTypeAddress,
  getEventTypeAddress,
  getCompanyAdminAddress,
  getFieldAddress,
  getBatchAddress,
  hashAndSlice,
} = require('../services/addressing')
const { createNewKeyPair } = require('./services/mock_utils')

describe('Batch Actions', function () {
  let handler = null
  let context = null

  let txn = null
  let state = null
  let decodedState = null
  let submission = null

  let systemAdminKeyPair = null
  let companyAdminKeyPair = null
  let operatorKeyPair = null

  // Company, Field and Batch identifiers.
  let companyId = null
  const fieldId = 'FDL1'
  const batchId = 'BTC1'
  const finalizedBatchId = 'BTC10'

  // Addresses.
  let companyAdminAddress = null
  let operatorAddress = null
  let companyAddress = null
  let fieldAddress = null
  let batchAddress = null
  let finalizedBatchAddress = null

  // Invalid addresses for testing purpose.
  let invalidCompanyAddress = null
  let invalidBatchAddress = null
  let invalidPropertyTypeAddress = null

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

    // Create a Batch.
    await mockCreateTransformationEvent(
      context, handler, operatorKeyPair.privateKey,
      getEventTypeAddress('EVT8'), [],
      [fieldAddress],
      [1000], getProductTypeAddress('PDT2'),
      batchId,
    )
    batchAddress = getBatchAddress(batchId)

    // Create a Batch and Finalize it.
    await mockCreateTransformationEvent(
      context, handler, operatorKeyPair.privateKey,
      getEventTypeAddress('EVT8'), [],
      [fieldAddress],
      [1000], getProductTypeAddress('PDT2'),
      finalizedBatchId,
    )
    finalizedBatchAddress = getBatchAddress(finalizedBatchId)

    await mockFinalizeBatch(
      context, handler, operatorKeyPair.privateKey,
      finalizedBatchAddress, Batch.Finalization.Reason.WITHDRAWN, 'No notes',
    )

    // Create invalid data for testing purpose.
    invalidCompanyAddress = getCompanyAddress('COMPANY_00')
    invalidBatchAddress = getBatchAddress('BTC0')
    invalidPropertyTypeAddress = getPropertyTypeAddress('PRT0')
  })

  describe('Add Batch Certificate Action', function () {
    // Mock data.
    const link = 'link1'
    const hash = hashAndSlice('document', 256)

    let certificationAuthorityKeyPair = null
    let certificationAuthorityKeyPair2 = null

    let certificationAuthorityAddress = null
    let certificationAuthorityAddress2 = null

    before(async function () {
      // Create the Certification Authority.
      certificationAuthorityKeyPair = createNewKeyPair()
      certificationAuthorityAddress = getCertificationAuthorityAddress(certificationAuthorityKeyPair.publicKey)
      await mockCreateCertificationAuthority(
        context, handler,
        systemAdminKeyPair.privateKey, certificationAuthorityKeyPair.publicKey,
        'CA1', 'website1', [getProductTypeAddress('PDT2')])

      // Create another Certification Authority for testing.
      certificationAuthorityKeyPair2 = createNewKeyPair()
      certificationAuthorityAddress2 = getCertificationAuthorityAddress(certificationAuthorityKeyPair2.publicKey)
      await mockCreateCertificationAuthority(
        context, handler,
        systemAdminKeyPair.privateKey, certificationAuthorityKeyPair2.publicKey,
        'CA2', 'website2', [getProductTypeAddress('PDT1')])
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no link specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({}),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if hash is not a valid SHA-512 string', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash.slice(0, 127),
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not a Certification Authority', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
          }),
        }),
        systemAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least Company state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: invalidCompanyAddress.slice(0, 30),
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least specified Company doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: invalidCompanyAddress,
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch doesn\'t match a Company Batch address', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: companyAddress,
            batch: invalidBatchAddress,
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch product doesn\'t match an enabled Certification Authority Product Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: companyAddress,
            batch: batchAddress,
          }),
        }),
        certificationAuthorityKeyPair2.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch is finalized', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: Date.now(),
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: companyAddress,
            batch: finalizedBatchAddress,
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should Add a Certificate on the Batch', async function () {
      const timestamp = Date.now()

      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
          timestamp: timestamp,
          addBatchCertificate: AddBatchCertificateAction.create({
            link: link,
            hash: hash,
            company: companyAddress,
            batch: batchAddress,
          }),
        }),
        certificationAuthorityKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Batch.
      state = context._state[batchAddress]
      decodedState = Batch.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(batchId)
      expect(decodedState.company).to.equal(companyAddress)
      expect(decodedState.certificates.length).to.equal(1)
      expect(decodedState.certificates[0].authority).to.equal(certificationAuthorityKeyPair.publicKey)
      expect(decodedState.certificates[0].link).to.equal(link)
      expect(decodedState.certificates[0].hash).to.equal(hash)
      expect(parseInt(decodedState.certificates[0].timestamp)).to.equal(timestamp)
    })
  })

  describe('Record Batch Property Action', function () {
    // Mock data.
    let propertyTypeDiffTaskAddress = null
    let propertyTypeDiffProductAddress = null

    let propertyTypeNumberAddress = null
    let propertyTypeStringAddress = null
    let propertyTypeBytesAddress = null
    let propertyTypeLocationAddress = null

    let propertyValueNumber = null
    let propertyValueNumber2 = null
    let propertyValueString = null
    let propertyValueBytes = null
    let propertyValueLocation = null

    before(async function () {
      // Property Type address.
      propertyTypeDiffTaskAddress = getPropertyTypeAddress('PRT5')
      propertyTypeDiffProductAddress = getPropertyTypeAddress('PRT6')

      propertyTypeNumberAddress = getPropertyTypeAddress('PRT1')
      propertyTypeStringAddress = getPropertyTypeAddress('PRT2')
      propertyTypeBytesAddress = getPropertyTypeAddress('PRT3')
      propertyTypeLocationAddress = getPropertyTypeAddress('PRT4')

      // Property values.
      propertyValueNumber = Batch.PropertyValue.create({
        numberValue: 10,
        timestamp: Date.now(),
      })

      propertyValueNumber2 = Batch.PropertyValue.create({
        numberValue: 20,
        timestamp: Date.now(),
      })

      propertyValueString = Batch.PropertyValue.create({
        stringValue: 'update',
        timestamp: Date.now(),
      })

      propertyValueBytes = Batch.PropertyValue.create({
        bytesValue: ['update'],
        timestamp: Date.now(),
      })

      propertyValueLocation = Batch.PropertyValue.create({
        locationValue: Shared.Location.create({ latitude: 39.23054, longitude: 9.11917 }),
        timestamp: Date.now(),
      })
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the signer is not an Operator', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({}),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch doesn\'t match a Company Batch address', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: invalidBatchAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the Property Type state address is not valid', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: invalidPropertyTypeAddress.slice(0, 30),
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if at least specified Property Type doesn\'t exist', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: invalidPropertyTypeAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if Operator task doesn\'t match an enabled Task Type for the Property Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeDiffTaskAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if Batch product doesn\'t match an enabled Product Type for the Property Type', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeDiffProductAddress,
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
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: finalizedBatchAddress,
            propertyType: propertyTypeNumberAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the number value field is not specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeNumberAddress,
            propertyValue: propertyValueBytes,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the string value field is not specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeStringAddress,
            propertyValue: propertyValueLocation,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the bytes value field is not specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeBytesAddress,
            propertyValue: propertyValueString,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if the location value field is not specified', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: Date.now(),
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeLocationAddress,
            propertyValue: propertyValueString,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should record a first Property on the Batch', async function () {
      const timestamp = Date.now()
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: timestamp,
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeNumberAddress,
            propertyValue: propertyValueNumber,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Batch.
      state = context._state[batchAddress]
      decodedState = Batch.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(batchId)
      expect(decodedState.properties[0].propertyType).to.equal(propertyTypeNumberAddress)
      expect(decodedState.properties[0].values.length).to.equal(1)
      expect(decodedState.properties[0].values[0].numberValue).to.equal(propertyValueNumber.numberValue)
    })

    it('Should update the first Property on the Batch', async function () {
      const timestamp = Date.now()
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: timestamp,
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeNumberAddress,
            propertyValue: propertyValueNumber2,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Batch.
      state = context._state[batchAddress]
      decodedState = Batch.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(batchId)
      expect(decodedState.properties[0].propertyType).to.equal(propertyTypeNumberAddress)
      expect(decodedState.properties[0].values.length).to.equal(2)
      expect(decodedState.properties[0].values[1].numberValue).to.equal(propertyValueNumber2.numberValue)
    })

    it('Should record a second Property on the Batch', async function () {
      const timestamp = Date.now()
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.RECORD_BATCH_PROPERTY,
          timestamp: timestamp,
          recordBatchProperty: RecordBatchPropertyAction.create({
            batch: batchAddress,
            propertyType: propertyTypeLocationAddress,
            propertyValue: propertyValueLocation,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Batch.
      state = context._state[batchAddress]
      decodedState = Batch.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(batchId)
      expect(decodedState.properties.length).to.equal(2)
      expect(decodedState.properties[1].propertyType).to.equal(propertyTypeLocationAddress)
      expect(decodedState.properties[1].values.length).to.equal(1)
      expect(parseInt(decodedState.properties[1].values[0].locationValue.latitude)).to.equal(parseInt(propertyValueLocation.locationValue.latitude))
      expect(parseInt(decodedState.properties[1].values[0].locationValue.longitude)).to.equal(parseInt(propertyValueLocation.locationValue.longitude))
    })
  })

  describe('Proposal Actions', function () {
    // Mock data.
    let companyAdminKeyPair2 = null
    let operatorKeyPair2 = null

    let companyId2 = null
    let companyAddress2 = null
    let operatorAddress2 = null

    let notReceiverCompanyAddress = null
    let notReceiverCompanyAdminKeyPair = null

    before(async function () {
      // Create a Company that cannot receive Batch from sender Company.
      notReceiverCompanyAdminKeyPair = createNewKeyPair()
      await mockCreateCompany(
        context, handler, systemAdminKeyPair.privateKey,
        'name', 'description', 'website',
        notReceiverCompanyAdminKeyPair.publicKey,
        [
          getProductTypeAddress('PDT4'),
        ],
      )
      notReceiverCompanyAddress = getCompanyAddress(hashAndSlice(notReceiverCompanyAdminKeyPair.publicKey, 10))

      // Create the receiver Company.
      companyAdminKeyPair2 = createNewKeyPair()
      await mockCreateCompany(
        context, handler, systemAdminKeyPair.privateKey,
        'name2', 'description2', 'website2',
        companyAdminKeyPair2.publicKey,
        [
          getProductTypeAddress('PDT1'),
          getProductTypeAddress('PDT2'),
          getProductTypeAddress('PDT3'),
        ],
      )
      companyId2 = hashAndSlice(companyAdminKeyPair2.publicKey, 10)
      companyAddress2 = getCompanyAddress(companyId2)

      // Create Operator.
      operatorKeyPair2 = createNewKeyPair()

      await mockCreateOperator(
        context, handler, companyAdminKeyPair2.privateKey,
        operatorKeyPair2.publicKey, getTaskTypeAddress('TKT1'),
      )
      operatorAddress2 = getOperatorAddress(operatorKeyPair2.publicKey)
    })

    describe('Create Proposal Action', function () {
      it('Should reject if no timestamp is given', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if no action data field is given', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if the signer is not an Operator', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({}),
          }),
          companyAdminKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if batch doesn\'t match a sender Company Batch address', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: invalidBatchAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least receiver Company state address is not valid', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: batchAddress,
              receiverCompany: invalidCompanyAddress.slice(0, 30),
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least specified receiver Company doesn\'t exist', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: batchAddress,
              receiverCompany: invalidCompanyAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if batch product doesn\'t match an enabled Product Type for the receiver Company', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: batchAddress,
              receiverCompany: notReceiverCompanyAddress,
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
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: finalizedBatchAddress,
              receiverCompany: companyAddress2,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should create a Proposal', async function () {
        const timestamp = Date.now()
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: timestamp,
            createProposal: CreateProposalAction.create({
              batch: batchAddress,
              receiverCompany: companyAddress2,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Batch.
        state = context._state[batchAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(batchId)
        expect(decodedState.proposals.length).to.equal(1)
        expect(decodedState.proposals[0].senderCompany).to.equal(companyAddress)
        expect(decodedState.proposals[0].receiverCompany).to.equal(companyAddress2)
        expect(decodedState.proposals[0].status).to.equal(Proposal.Status.ISSUED)
        expect(parseInt(decodedState.proposals[0].timestamp)).to.equal(timestamp)
      })

      it('Should reject if batch already has an issued Proposal', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.CREATE_PROPOSAL,
            timestamp: Date.now(),
            createProposal: CreateProposalAction.create({
              batch: batchAddress,
              receiverCompany: companyAddress2,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })
    })

    describe('Answer Proposal Action', function () {
      // Mock data.
      const canceled = Proposal.Status.CANCELED
      const accepted = Proposal.Status.ACCEPTED
      const rejected = Proposal.Status.REJECTED

      const batchToRejectId = 'BTC3'
      const batchToCancelId = 'BTC4'
      let batchNoProposalAddress = null
      let batchToRejectAddress = null
      let batchToCancelAddress = null

      before(async function () {
        // Create a Batch.
        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair.privateKey,
          getEventTypeAddress('EVT8'), [],
          [fieldAddress],
          [10], getProductTypeAddress('PDT2'),
          'BTC2',
        )
        batchNoProposalAddress = getBatchAddress('BTC2')

        // Create a Batch and a Proposal.
        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair.privateKey,
          getEventTypeAddress('EVT8'), [],
          [fieldAddress],
          [10], getProductTypeAddress('PDT2'),
          batchToRejectId,
        )
        batchToRejectAddress = getBatchAddress(batchToRejectId)

        await mockCreateProposal(
          context, handler, operatorKeyPair.privateKey,
          batchToRejectAddress, companyAddress2, 'To reject',
        )

        await mockCreateTransformationEvent(
          context, handler, operatorKeyPair.privateKey,
          getEventTypeAddress('EVT8'), [],
          [fieldAddress],
          [10], getProductTypeAddress('PDT2'),
          batchToCancelId,
        )
        batchToCancelAddress = getBatchAddress(batchToCancelId)

        await mockCreateProposal(
          context, handler, operatorKeyPair.privateKey,
          batchToCancelAddress, companyAddress2, 'To cancel',
        )
      })

      it('Should reject if no timestamp is given', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if no action data field is given', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if response doesn\'t match one any possible value', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: -1,
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
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
            }),
          }),
          companyAdminKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least sender Company state address is not valid', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: invalidCompanyAddress.slice(0, 30),
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if at least specified sender Company doesn\'t exist', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: invalidCompanyAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if batch doesn\'t match a sender Company Batch address', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: companyAddress,
              batch: invalidBatchAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if batch doesn\'t have Proposal with status issued', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: companyAddress,
              batch: batchNoProposalAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if Operator from receiver Company cannot answer cancel status for Proposal', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: canceled,
              senderCompany: companyAddress,
              batch: batchAddress,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should reject if Operator from sender Company cannot answer accepted or rejected status for Proposal', async function () {
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: Date.now(),
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: companyAddress,
              batch: batchAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        submission = handler.apply(txn, context)

        return expect(submission).to.be.rejectedWith(InvalidTransaction)
      })

      it('Should accept the Proposal', async function () {
        const timestamp = Date.now()
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: timestamp,
            answerProposal: AnswerProposalAction.create({
              response: accepted,
              senderCompany: companyAddress,
              batch: batchAddress,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        await handler.apply(txn, context)

        // Batch.
        state = context._state[batchAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(batchId)
        expect(decodedState.company).to.equal(companyAddress2)
        expect(decodedState.proposals.length).to.equal(1)
        expect(decodedState.proposals[0].senderCompany).to.equal(companyAddress)
        expect(decodedState.proposals[0].receiverCompany).to.equal(companyAddress2)
        expect(decodedState.proposals[0].status).to.equal(Proposal.Status.ACCEPTED)

        // Sender company.
        state = context._state[companyAddress]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId)
        expect(decodedState.batches.length).to.equal(4)

        // Receiver company.
        state = context._state[companyAddress2]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId2)
        expect(decodedState.batches.length).to.equal(1)
      })

      it('Should reject the Proposal', async function () {
        const timestamp = Date.now()
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: timestamp,
            answerProposal: AnswerProposalAction.create({
              response: rejected,
              senderCompany: companyAddress,
              batch: batchToRejectAddress,
            }),
          }),
          operatorKeyPair2.privateKey,
        )

        await handler.apply(txn, context)

        // Batch.
        state = context._state[batchToRejectAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(batchToRejectId)
        expect(decodedState.company).to.equal(companyAddress)
        expect(decodedState.proposals.length).to.equal(1)
        expect(decodedState.proposals[0].senderCompany).to.equal(companyAddress)
        expect(decodedState.proposals[0].receiverCompany).to.equal(companyAddress2)
        expect(decodedState.proposals[0].status).to.equal(Proposal.Status.REJECTED)

        // Sender company.
        state = context._state[companyAddress]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId)
        expect(decodedState.batches.length).to.equal(4)

        // Receiver company.
        state = context._state[companyAddress2]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId2)
        expect(decodedState.batches.length).to.equal(1)
      })

      it('Should cancel the Proposal', async function () {
        const timestamp = Date.now()
        txn = new Txn(
          SCPayload.create({
            action: SCPayloadActions.ANSWER_PROPOSAL,
            timestamp: timestamp,
            answerProposal: AnswerProposalAction.create({
              response: canceled,
              senderCompany: companyAddress,
              batch: batchToCancelAddress,
            }),
          }),
          operatorKeyPair.privateKey,
        )

        await handler.apply(txn, context)

        // Batch.
        state = context._state[batchToCancelAddress]
        decodedState = Batch.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(batchToCancelId)
        expect(decodedState.company).to.equal(companyAddress)
        expect(decodedState.proposals.length).to.equal(1)
        expect(decodedState.proposals[0].senderCompany).to.equal(companyAddress)
        expect(decodedState.proposals[0].receiverCompany).to.equal(companyAddress2)
        expect(decodedState.proposals[0].status).to.equal(Proposal.Status.CANCELED)

        // Sender company.
        state = context._state[companyAddress]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId)
        expect(decodedState.batches.length).to.equal(4)

        // Receiver company.
        state = context._state[companyAddress2]
        decodedState = Company.decode(state)

        expect(state).to.not.be.null
        expect(decodedState.id).to.equal(companyId2)
        expect(decodedState.batches.length).to.equal(1)
      })
    })
  })

  describe('Finalize Batch Action', function () {
    // Mock data.
    const reason = Batch.Finalization.Reason.WITHDRAWN
    const batchProposalId = 'BTC5'
    const batchToFinalizeId = 'BTC6'

    let companyAdminKeyPair2 = null
    let companyId2 = null
    let companyAddress2 = null
    let batchProposalAddress = null
    let batchToFinalizeAddress = null

    before(async function () {
      // Create the receiver Company.
      companyAdminKeyPair2 = createNewKeyPair()
      await mockCreateCompany(
        context, handler, systemAdminKeyPair.privateKey,
        'name2', 'description2', 'website2',
        companyAdminKeyPair2.publicKey,
        [
          getProductTypeAddress('PDT1'),
          getProductTypeAddress('PDT2'),
          getProductTypeAddress('PDT3'),
        ],
      )
      companyId2 = hashAndSlice(companyAdminKeyPair2.publicKey, 10)
      companyAddress2 = getCompanyAddress(companyId2)

      // Create a Batch and Proposal.
      await mockCreateTransformationEvent(
        context, handler, operatorKeyPair.privateKey,
        getEventTypeAddress('EVT8'), [],
        [fieldAddress],
        [10], getProductTypeAddress('PDT2'),
        batchProposalId,
      )
      batchProposalAddress = getBatchAddress(batchProposalId)

      await mockCreateProposal(
        context, handler, operatorKeyPair.privateKey,
        batchProposalAddress, companyAddress2, 'No notes',
      )

      // Create a Batch.
      await mockCreateTransformationEvent(
        context, handler, operatorKeyPair.privateKey,
        getEventTypeAddress('EVT8'), [],
        [fieldAddress],
        [10], getProductTypeAddress('PDT2'),
        batchToFinalizeId,
      )
      batchToFinalizeAddress = getBatchAddress(batchToFinalizeId)
    })

    it('Should reject if no timestamp is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if no action data field is given', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if reason doesn\'t match one any possible value', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
          finalizeBatch: FinalizeBatchAction.create({
            reason: -1,
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
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
          finalizeBatch: FinalizeBatchAction.create({
            reason: reason,
          }),
        }),
        companyAdminKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch doesn\'t match a Company Batch address', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
          finalizeBatch: FinalizeBatchAction.create({
            reason: reason,
            batch: invalidBatchAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should reject if batch has an issued Proposal', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
          finalizeBatch: FinalizeBatchAction.create({
            reason: reason,
            batch: batchProposalAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })

    it('Should Finalize the Batch', async function () {
      const timestamp = Date.now()
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: timestamp,
          finalizeBatch: FinalizeBatchAction.create({
            reason: reason,
            batch: batchToFinalizeAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      await handler.apply(txn, context)

      // Batch.
      state = context._state[batchToFinalizeAddress]
      decodedState = Batch.decode(state)

      expect(state).to.not.be.null
      expect(decodedState.id).to.equal(batchToFinalizeId)
      expect(decodedState.finalization.reporter).to.equal(operatorKeyPair.publicKey)
      expect(decodedState.finalization.reason).to.equal(reason)
      expect(decodedState.finalization.explanation).to.be.empty
    })

    it('Should reject if the Batch has already been finalized', async function () {
      txn = new Txn(
        SCPayload.create({
          action: SCPayloadActions.FINALIZE_BATCH,
          timestamp: Date.now(),
          finalizeBatch: FinalizeBatchAction.create({
            reason: reason,
            batch: batchToFinalizeAddress,
          }),
        }),
        operatorKeyPair.privateKey,
      )

      submission = handler.apply(txn, context)

      return expect(submission).to.be.rejectedWith(InvalidTransaction)
    })
  })
})
