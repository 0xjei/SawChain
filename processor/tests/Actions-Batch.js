'use_strict'

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions')
const {expect} = require('chai')
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
    populateStateWithMockData
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
    FinalizeBatchAction
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
    hashAndSlice
} = require('../services/addressing')
const {createNewKeyPair} = require('./services/mock_utils')

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
    const fieldId = "FDL1"
    const batchId = "BTC1"

    // Addresses.
    let companyAdminAddress = null
    let operatorAddress = null
    let companyAddress = null
    let fieldAddress = null
    let batchAddress = null

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
            "name1", "description1", "website1",
            companyAdminKeyPair.publicKey,
            [
                getProductTypeAddress("PDT2"),
                getProductTypeAddress("PDT3"),
                getProductTypeAddress("PDT4")
            ]
        )

        await mockCreateField(
            context, handler, companyAdminKeyPair.privateKey,
            fieldId, "description1", getProductTypeAddress("PDT3"), 15000,
            Shared.Location.create({latitude: 39.23054, longitude: 9.11917})
        )

        // Create an Operator.
        operatorKeyPair = createNewKeyPair()
        operatorAddress = getOperatorAddress(operatorKeyPair.publicKey)

        await mockCreateOperator(
            context, handler, companyAdminKeyPair.privateKey, operatorKeyPair.publicKey, getTaskTypeAddress("TKT1")
        )

        // Create a Batch.
        await mockCreateTransformationEvent(
            context, handler, operatorKeyPair.privateKey,
            getEventTypeAddress('EVT8'), [],
            [fieldAddress],
            [1000], getProductTypeAddress('PDT2'),
            batchId
        )
        batchAddress = getBatchAddress(batchId)

        // Create invalid data for testing purpose.
        invalidCompanyAddress = getCompanyAddress('COMPANY_00')
        invalidBatchAddress = getBatchAddress('BTC0')
        invalidPropertyTypeAddress = getPropertyTypeAddress('PRT0')
    })

    describe('Add Batch Certificate Action', function () {
        // Mock data.
        const link = "link1"
        const hash = hashAndSlice("document", 256)

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
                "CA1", "website1", [getProductTypeAddress('PDT2')])

            // Create another Certification Authority for testing.
            certificationAuthorityKeyPair2 = createNewKeyPair()
            certificationAuthorityAddress2 = getCertificationAuthorityAddress(certificationAuthorityKeyPair2.publicKey)
            await mockCreateCertificationAuthority(
                context, handler,
                systemAdminKeyPair.privateKey, certificationAuthorityKeyPair2.publicKey,
                "CA2", "website2", [getProductTypeAddress('PDT1')])
        })

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_BATCH_CERTIFICATE
                }),
                certificationAuthorityKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
                    timestamp: Date.now()
                }),
                certificationAuthorityKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no link specified', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
                    timestamp: Date.now(),
                    addBatchCertificate: AddBatchCertificateAction.create({})
                }),
                certificationAuthorityKeyPair.privateKey
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
                        hash: hash.slice(0, 127)
                    })
                }),
                certificationAuthorityKeyPair.privateKey
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
                        hash: hash
                    })
                }),
                systemAdminKeyPair.privateKey
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
                        company: invalidCompanyAddress.slice(0, 30)
                    })
                }),
                certificationAuthorityKeyPair.privateKey
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
                        company: invalidCompanyAddress
                    })
                }),
                certificationAuthorityKeyPair.privateKey
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
                        batch: invalidBatchAddress
                    })
                }),
                certificationAuthorityKeyPair.privateKey
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
                        batch: batchAddress
                    })
                }),
                certificationAuthorityKeyPair2.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should Add a Certificate on the Batch', async function () {
            let timestamp = Date.now()

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_BATCH_CERTIFICATE,
                    timestamp: timestamp,
                    addBatchCertificate: AddBatchCertificateAction.create({
                        link: link,
                        hash: hash,
                        company: companyAddress,
                        batch: batchAddress
                    })
                }),
                certificationAuthorityKeyPair.privateKey
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
                timestamp: Date.now()
            })

            propertyValueNumber2 = Batch.PropertyValue.create({
                numberValue: 20,
                timestamp: Date.now()
            })

            propertyValueString = Batch.PropertyValue.create({
                stringValue: "update",
                timestamp: Date.now()
            })

            propertyValueBytes = Batch.PropertyValue.create({
                bytesValue: ["update"],
                timestamp: Date.now()
            })

            propertyValueLocation = Batch.PropertyValue.create({
                locationValue: Shared.Location.create({latitude: 39.23054, longitude: 9.11917}),
                timestamp: Date.now()
            })
        })

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.RECORD_BATCH_PROPERTY
                }),
                operatorKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.RECORD_BATCH_PROPERTY,
                    timestamp: Date.now()
                }),
                operatorKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the signer is not an Operator', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.RECORD_BATCH_PROPERTY,
                    timestamp: Date.now(),
                    recordBatchProperty: RecordBatchPropertyAction.create({})
                }),
                companyAdminKeyPair.privateKey
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
                        batch: invalidBatchAddress
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyType: invalidPropertyTypeAddress.slice(0, 30)
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyType: invalidPropertyTypeAddress
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyType: propertyTypeDiffTaskAddress
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyType: propertyTypeDiffProductAddress
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueBytes
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueLocation
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueString
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueString
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueNumber
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueNumber2
                    })
                }),
                operatorKeyPair.privateKey
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
                        propertyValue: propertyValueLocation
                    })
                }),
                operatorKeyPair.privateKey
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

    describe('Batch Ownership Actions', function () {
        let cmpAdminKeyPair2 = null
        let cmpAdminKeyPair3 = null
        let optKeyPair2 = null

        let companyId2 = null
        let companyId3 = null

        let companyAddress2 = null
        let companyAddress3 = null
        let operatorAddress2 = null
        let proposalAddress = null

        before(async function () {
            // Create a new Company Admin.
            cmpAdminKeyPair2 = createNewKeyPair()
            companyId2 = hashAndSlice(cmpAdminKeyPair2.publicKey, 10)
            cmpAdminKeyPair3 = createNewKeyPair()
            companyId3 = hashAndSlice(cmpAdminKeyPair3.publicKey, 10)

            // Company address.
            companyAddress2 = getCompanyAddress(companyId2)
            companyAddress3 = getCompanyAddress(companyId3)

            // Create Company.
            await mockCreateCompany(context, handler, sysAdminKeyPair.privateKey, "company2", "desc2", "web2", cmpAdminKeyPair2.publicKey, ["prd1", "prd2", "prd3"])
            await mockCreateCompany(context, handler, sysAdminKeyPair.privateKey, "company3", "desc3", "web3", cmpAdminKeyPair3.publicKey, ["prd1", "prd3"])

            // Create Operator.
            optKeyPair2 = createNewKeyPair()
            operatorAddress2 = getOperatorAddress(optKeyPair2.publicKey)
            await mockCreateOperator(context, handler, cmpAdminKeyPair2.privateKey, optKeyPair2.publicKey, "task1")
        })

        describe('Create Proposal Action', function () {
            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now()
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no batch is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({})
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no receiver company is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: batchId
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if the signer is not an Operator', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: batchId,
                            receiverCompany: companyId2
                        })
                    }),
                    cmpAdminKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for company does not match with a valid Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: batchId,
                            receiverCompany: "no-company"
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for batch does not match with a Company Batch', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: "no-batch",
                            receiverCompany: companyId2
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for batch does not match with a Company Batch', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: batchId,
                            receiverCompany: companyId3
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should create a Proposal', async function () {
                const timestamp = Date.now()
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: timestamp,
                        createProposal: CreateProposalAction.create({
                            batch: batchId,
                            receiverCompany: companyId2
                        })
                    }),
                    optKeyPair.privateKey
                )

                await handler.apply(txn, context)

                // Batch.
                state = context._state[batchAddress]

                expect(state).to.not.be.null
                expect(Batch.decode(state).id).to.equal(batchId)
                expect(Batch.decode(state).proposals.length).to.equal(1)
                expect(Batch.decode(state).proposals[0].senderCompany).to.equal(companyId)
                expect(Batch.decode(state).proposals[0].receiverCompany).to.equal(companyId2)
                expect(Batch.decode(state).proposals[0].status).to.equal(Proposal.Status.ISSUED)
                expect(parseInt(Batch.decode(state).proposals[0].timestamp)).to.equal(timestamp)
            })

            it('Should reject if provided batch already has a issued Proposal', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.CREATE_PROPOSAL,
                        timestamp: Date.now(),
                        createProposal: CreateProposalAction.create({
                            batch: batchId,
                            receiverCompany: companyId2
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })
        })

        describe('Answer Proposal Action', function () {
            const cancelled = Proposal.Status.CANCELED
            const accepted = Proposal.Status.ACCEPTED
            const rejected = Proposal.Status.REJECTED

            before(async function () {
                // Create a batch for company 1.
                await mockCreateTransformationEvent(context, handler, optKeyPair.privateKey, "event7", [], [fieldId], [10], "prd2", "batch2")
            })

            it('Should reject if no timestamp is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no action data field is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now()
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no batch is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({})
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no sender company is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no receiver company is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if no response is given', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: companyId2
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if the signer is not an Operator', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: cancelled
                        })
                    }),
                    cmpAdminKeyPair.privateKey
                )
                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for sender company does not match with a valid Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: "no-company",
                            receiverCompany: companyId2,
                            response: cancelled
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for receiver company does not match with a valid Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: "no-company",
                            response: cancelled
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for batch does not match with a sender Company Batch', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: "no-batch",
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: cancelled
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for response is not valid if Operator is not from sender Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: cancelled
                        })
                    }),
                    optKeyPair2.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided value for response is not valid if Operator is not from receiver Company', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: rejected
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should reject if provided batch doesn\'t have at least an issued Proposals', async function () {
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: Date.now(),
                        answerProposal: AnswerProposalAction.create({
                            batch: "batch2",
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: cancelled
                        })
                    }),
                    optKeyPair.privateKey
                )

                const submission = handler.apply(txn, context)

                return expect(submission).to.be.rejectedWith(InvalidTransaction)
            })

            it('Should accept a Proposal', async function () {
                const timestamp = Date.now()
                txn = new Txn(
                    SCPayload.create({
                        action: SCPayloadActions.ANSWER_PROPOSAL,
                        timestamp: timestamp,
                        answerProposal: AnswerProposalAction.create({
                            batch: batchId,
                            senderCompany: companyId,
                            receiverCompany: companyId2,
                            response: accepted
                        })
                    }),
                    optKeyPair2.privateKey
                )
                await handler.apply(txn, context)

                // Batch.
                state = context._state[batchAddress]

                expect(state).to.not.be.null
                expect(Batch.decode(state).id).to.equal(batchId)
                expect(Batch.decode(state).company).to.equal(companyId2)
                expect(Batch.decode(state).proposals.length).to.equal(1)
                expect(Batch.decode(state).proposals[0].senderCompany).to.equal(companyId)
                expect(Batch.decode(state).proposals[0].receiverCompany).to.equal(companyId2)
                expect(Batch.decode(state).proposals[0].status).to.equal(Proposal.Status.ACCEPTED)

                // Sender company.
                state = context._state[companyAddress]

                expect(state).to.not.be.null
                expect(Company.decode(state).id).to.equal(companyId)
                expect(Company.decode(state).batches.length).to.equal(1)

                // Receiver company.
                state = context._state[companyAddress2]

                expect(state).to.not.be.null
                expect(Company.decode(state).id).to.equal(companyId2)
                expect(Company.decode(state).batches.length).to.equal(1)
            })

            /// todo add tests for cancelled and rejected
        })
    })

    describe('Finalize Batch Action', function () {
        const batch = "batch2"
        let batchAddress2 = null

        const reason = Batch.Finalization.Reason.WITHDRAWN

        before(async function () {
            batchAddress2 = getBatchAddress(batch)
        })

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH
                }),
                optKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: Date.now()
                }),
                optKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no batch is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: Date.now(),
                    finalizeBatch: FinalizeBatchAction.create({})
                }),
                optKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if provided value for reason doesn\'t contain a valid reason', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: Date.now(),
                    finalizeBatch: FinalizeBatchAction.create({
                        batch: batch,
                        reason: -1
                    })
                }),
                optKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the signer is not an Operator', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: Date.now(),
                    finalizeBatch: FinalizeBatchAction.create({
                        batch: batch,
                        reason: reason
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if provided value for batch does not match with a sender Company Batch', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: Date.now(),
                    finalizeBatch: FinalizeBatchAction.create({
                        batch: "no-batch",
                        reason: reason
                    })
                }),
                optKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should finalize the batch', async function () {
            const timestamp = Date.now()
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.FINALIZE_BATCH,
                    timestamp: timestamp,
                    finalizeBatch: FinalizeBatchAction.create({
                        batch: batch,
                        reason: reason
                    })
                }),
                optKeyPair.privateKey
            )

            await handler.apply(txn, context)

            // Batch.
            state = context._state[batchAddress2]

            expect(state).to.not.be.null
            expect(Batch.decode(state).id).to.equal(batch)
            expect(Batch.decode(state).finalization.reporter).to.equal(optKeyPair.publicKey)
            expect(Batch.decode(state).finalization.reason).to.equal(reason)
            expect(Batch.decode(state).finalization.explanation).to.be.empty
        })
    })
})
