const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions')
const {expect} = require('chai')
const Txn = require('./services/mock_txn')
const Context = require('./services/mock_context')
const SawChainHandler = require('./services/handler_wrapper')
const {
    mockCreateCompany,
    populateStateWithMockData
} = require('./services/mock_entities')
const {
    SCPayload,
    SCPayloadActions,
    SystemAdmin,
    Operator,
    CertificationAuthority,
    Company,
    UpdateSystemAdminAction,
    CreateOperatorAction,
    CreateCertificationAuthorityAction
} = require('../services/proto')
const {
    getSystemAdminAddress,
    getOperatorAddress,
    getProductTypeAddress,
    getCompanyAddress,
    getCertificationAuthorityAddress,
    hashAndSlice
} = require('../services/addressing')
const {createNewKeyPair} = require('./services/mock_utils')

describe('User Actions', function () {
    let handler = null
    let context = null

    let txn = null
    let state = null
    let decodedState = null
    let submission = null

    // System Admin key pair.
    let systemAdminKeyPair = null
    let systemAdminAddress = null
    let newSystemAdminKeyPair = null


    before(async function () {
        // Create a new SawChain Handler and state Context objects.
        handler = new SawChainHandler()
        context = new Context()

        // System Admin key pair.
        systemAdminKeyPair = createNewKeyPair()
        systemAdminAddress = getSystemAdminAddress()
    })

    describe('Create System Admin', function () {
        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_SYSTEM_ADMIN
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should create the System Admin', async function () {
            const timestamp = Date.now()

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_SYSTEM_ADMIN,
                    timestamp: timestamp
                }),
                systemAdminKeyPair.privateKey
            )

            await handler.apply(txn, context)

            // Check.
            state = context._state[systemAdminAddress]
            decodedState = SystemAdmin.decode(state)

            expect(state).to.not.be.null
            expect(decodedState.publicKey).to.equal(systemAdminKeyPair.publicKey)
            expect(parseInt(decodedState.timestamp)).to.equal(timestamp)
        })

        it('Should reject if the System Admin is already recorded', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_SYSTEM_ADMIN,
                    timestamp: Date.now()
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })
    })

    describe('Update System Admin', function () {
        before(function () {
            // New System Admin key pair.
            newSystemAdminKeyPair = createNewKeyPair()
        })

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN,
                    timestamp: Date.now()
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the publicKey field doesn\'t contain a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN,
                    timestamp: Date.now(),
                    updateSystemAdmin: UpdateSystemAdminAction.create({
                        publicKey: newSystemAdminKeyPair.publicKey.slice(0, 65)
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN,
                    timestamp: Date.now(),
                    updateSystemAdmin: UpdateSystemAdminAction.create({
                        publicKey: newSystemAdminKeyPair.publicKey
                    })
                }),
                newSystemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the public key belongs to another authorized user', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN,
                    timestamp: Date.now(),
                    updateSystemAdmin: UpdateSystemAdminAction.create({
                        publicKey: systemAdminKeyPair.publicKey
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should update the System Admin', async function () {
            const timestamp = Date.now()

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.UPDATE_SYSTEM_ADMIN,
                    timestamp: timestamp,
                    updateSystemAdmin: UpdateSystemAdminAction.create({
                        publicKey: newSystemAdminKeyPair.publicKey
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            await handler.apply(txn, context)

            state = context._state[systemAdminAddress]
            decodedState = SystemAdmin.decode(state)

            expect(state).to.not.be.null
            expect(decodedState.publicKey).to.equal(newSystemAdminKeyPair.publicKey)
            expect(parseInt(decodedState.timestamp)).to.equal(timestamp)
        })

        after(async function () {
            // Replace System Admin key pair with the new one.
            systemAdminKeyPair = newSystemAdminKeyPair

            // Populate the state with mock Types data.
            await populateStateWithMockData(context, handler, systemAdminKeyPair.privateKey)
        })
    })

    describe('Create Operator Action', async function () {
        const task = "task1"

        let cmpAdminKeyPair = null
        let optKeyPair = null

        let companyId = null
        const companyName = "mock-company-name"
        const companyDescription = "mock-company-description"
        const companyWebsite = "mock-company-website"

        let companyAddress = null
        let operatorAddress = null

        before(async function () {
            // Company Admin key pair.
            cmpAdminKeyPair = createNewKeyPair()
            companyId = hashAndSlice(cmpAdminKeyPair.publicKey, 10)
            companyAddress = getCompanyAddress(companyId)

            // Populate the state with a Company.
            await mockCreateCompany(context, handler, systemAdminKeyPair.privateKey, companyName, companyDescription, companyWebsite, cmpAdminKeyPair.publicKey, ["prd1", "prd2", "prd3"])

            // Operator key pair.
            optKeyPair = createNewKeyPair()
            operatorAddress = getOperatorAddress(optKeyPair.publicKey)
        })


        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now()
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no public key is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({})
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no task is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if public key is public key field doesn\'t contains a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey.slice(0, 30),
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if transaction signer is not the Company Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if given public key match with a Company Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: cmpAdminKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the provided value for task doesn\'t match a valid Task Type', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: "error"
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should create the Operator', async function () {
            const timestamp = Date.now()

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: timestamp,
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            await handler.apply(txn, context)

            // Field.
            state = context._state[operatorAddress]

            expect(state).to.not.be.null
            expect(Operator.decode(state).publicKey).to.equal(optKeyPair.publicKey)
            expect(Operator.decode(state).company).to.equal(companyId)
            expect(Operator.decode(state).task).to.equal(task)
            expect(parseInt(Operator.decode(state).timestamp)).to.equal(timestamp)

            // Company.
            state = context._state[companyAddress]

            expect(state).to.not.be.null
            expect(Company.decode(state).operators.length).to.equal(1)
        })

        it('Should reject if there is already an Operator with the provided public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_OPERATOR,
                    timestamp: Date.now(),
                    createOperator: CreateOperatorAction.create({
                        publicKey: optKeyPair.publicKey,
                        task: task
                    })
                }),
                cmpAdminKeyPair.privateKey
            )

            const submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })
    })

    describe('Create Certification Authority Action', async function () {
        const name = "name1"
        const website = "website1"

        let caKeyPair = null
        let caAddress = null
        let enabledProductTypes = null
        let invalidProductTypeAddress = null

        before(async function () {
            // Get Certification Authority key pair and state address.
            caKeyPair = createNewKeyPair()
            caAddress = getCertificationAuthorityAddress(caKeyPair.publicKey)

            enabledProductTypes = [
                getProductTypeAddress("PDT1"),
                getProductTypeAddress("PDT2")
            ]

            // Create invalid data for testing purpose.
            invalidProductTypeAddress = getProductTypeAddress('PDT0')
        })

        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now()
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the publicKey field doesn\'t contain a valid public key', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey.slice(0, 65)
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no name specified', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if no website specified', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: name
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the signer is not the System Admin', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: name,
                        website: website,
                    })
                }),
                caKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if the public key belongs to another authorized user', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: systemAdminKeyPair.publicKey,
                        name: name,
                        website: website
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if at least one Product Type state address is not valid', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: name,
                        website: website,
                        enabledProductTypes: [
                            invalidProductTypeAddress.slice(0, 30)
                        ]
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should reject if at least one specified Product Type doesn\'t exist', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: name,
                        website: website,
                        enabledProductTypes: [
                            invalidProductTypeAddress
                        ]
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            submission = handler.apply(txn, context)

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        })

        it('Should create the Certification Authority', async function () {
            const timestamp = Date.now()

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
                    timestamp: Date.now(),
                    createCertificationAuthority: CreateCertificationAuthorityAction.create({
                        publicKey: caKeyPair.publicKey,
                        name: name,
                        website: website,
                        enabledProductTypes: enabledProductTypes
                    })
                }),
                systemAdminKeyPair.privateKey
            )

            await handler.apply(txn, context)

            state = context._state[caAddress]
            decodedState = CertificationAuthority.decode(state)

            expect(state).to.not.be.null
            expect(decodedState.publicKey).to.equal(caKeyPair.publicKey)
            expect(decodedState.name).to.equal(name)
            expect(decodedState.website).to.equal(website)
            expect(decodedState.enabledProductTypes.length).to.equal(enabledProductTypes.length)
            expect(decodedState.enabledProductTypes[0]).to.equal(enabledProductTypes[0])
            expect(decodedState.enabledProductTypes[1]).to.equal(enabledProductTypes[1])
            expect(parseInt(decodedState.timestamp)).to.equal(timestamp)
        })
    })
})
