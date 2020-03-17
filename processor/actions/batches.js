'use strict'

const {
    Operator,
    CertificationAuthority,
    PropertyType,
    Company,
    Batch,
    Proposal,
    Certificate,
    Shared
} = require('../services/proto')
const {
    reject,
    isValidPublicKey,
    isPublicKeyUsed,
    checkStateAddresses,
    isPresent
} = require('../services/utils')
const {
    getOperatorAddress,
    getPropertyTypeAddress,
    getCompanyAddress,
    getBatchAddress,
    getCertificationAuthorityAddress,
    FULL_PREFIXES,
    TYPE_PREFIXES
} = require('../services/addressing')

/**
 * Check it the correct field for Property Value is set.
 * @param {Object} propertyValue The Property Value object to verify.
 * @param {Number} dataType The data type used for the parameter information.
 */
const isCorrectFieldSet = async (propertyValue, dataType) => {
    switch (dataType) {
        // Number data type.
        case Shared.DataType.NUMBER:
            // Validation: The number value field is not specified.
            if (propertyValue.stringValue.length > 0 ||
                propertyValue.bytesValue.length > 0 ||
                propertyValue.locationValue
            )
                reject(`The number value field is not specified`)
            break

        // String data type.
        case Shared.DataType.STRING:
            // Validation: The string value field is not specified.
            if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.bytesValue.length > 0 ||
                propertyValue.locationValue
            )
                reject(`The string value field is not specified`)
            break

        // Bytes data type.
        case Shared.DataType.BYTES:
            // Validation: The bytes value field is not specified.
            if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.stringValue.length > 0 ||
                propertyValue.locationValue
            )
                reject(`The bytes value field is not specified`)
            break

        // Location data type.
        case Shared.DataType.LOCATION:
            // Validation: The location value field is not specified.
            if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.stringValue.length > 0 ||
                propertyValue.bytesValue.length > 0
            )
                reject(`The location value field is not specified`)
            break
    }
}

/**
 * Add a new Certificate on a Batch.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch The Batch state address.
 * @param {String} company The Company state address.
 * @param {String} link The Certificate external resource link.
 * @param {String} hash The Certificate external resource hash.
 */
async function addBatchCertificate(
    context,
    signerPublicKey,
    timestamp,
    {batch, company, link, hash}
) {
    // Validation: No link specified.
    if (!link)
        reject(`No link specified`)

    // Validation: Hash is not a valid SHA-512 string.
    if (!RegExp(`^[0-9A-Fa-f]{128}$`).test(hash))
        reject(`Hash is not a valid SHA-512 string`)

    const certificationAuthorityAddress = getCertificationAuthorityAddress(signerPublicKey)

    const state = await context.getState([
        certificationAuthorityAddress,
        company,
        batch
    ])

    const certificationAuthorityState = CertificationAuthority.decode(state[certificationAuthorityAddress])
    const companyState = Company.decode(state[company])
    const batchState = Batch.decode(state[batch])

    // Validation: The signer is not a Certification Authority.
    if (certificationAuthorityState.publicKey !== signerPublicKey)
        reject(`The signer is not a Certification Authority`)

    // Validation: The Company address is not well-formatted or not exists.
    await checkStateAddresses(
        context,
        [company],
        FULL_PREFIXES.COMPANY,
        "Company"
    )

    // Validation: Batch doesn't match a Company Batch address.
    await isPresent(companyState.batches, batch, "a Company Batch")

    // Validation: Batch product doesn't match an enabled Certification Authority Product Type.
    await isPresent(
        certificationAuthorityState.enabledProductTypes,
        batchState.product,
        "an enabled Certification Authority Product Type"
    )

    // State update.
    const updates = {}

    // Record Certificate on the Batch.
    batchState.certificates.push(Certificate.create({
        authority: signerPublicKey,
        link: link,
        hash: hash,
        timestamp: timestamp
    }))

    // Update Batch.
    updates[batch] = Batch.encode(batchState).finish()

    await context.setState(updates)
}


/**
 * Handle Record of a Batch Property transaction action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch The Batch state address where record the Property.
 * @param {String} propertyType The Property Type state address.
 * @param {Object} propertyValue The Property Value used to update the Property on Batch.
 */
async function recordBatchProperty(
    context,
    signerPublicKey,
    timestamp,
    {batch, propertyType, propertyValue}
) {
    const operatorAddress = getOperatorAddress(signerPublicKey)

    let state = await context.getState([
        operatorAddress
    ])

    const operatorState = Operator.decode(state[operatorAddress])

    // Validation: The signer is not an Operator.
    if (operatorState.publicKey !== signerPublicKey)
        reject(`The signer is not an Operator`)

    const companyAddress = operatorState.company

    state = await context.getState([
        companyAddress,
        propertyType,
        batch
    ])

    const propertyTypeState = PropertyType.decode(state[propertyType])
    const companyState = Company.decode(state[companyAddress])
    const batchState = Batch.decode(state[batch])

    // Validation: Batch doesn't match a Company Batch address.
    await isPresent(companyState.batches, batch, "a Company Batch")

    // Validation: The Property Type address is not well-formatted or not exists.
    await checkStateAddresses(
        context,
        [propertyType],
        FULL_PREFIXES.TYPES + TYPE_PREFIXES.PROPERTY_TYPE,
        "Property Type"
    )

    // Validation: Operator task doesn't match an enabled Task Type for the Property Type.
    await isPresent(propertyTypeState.enabledTaskTypes, operatorState.task, "an enabled Task Type for the Property Type")

    // Validation: Batch product doesn't match an enabled Product Type for the Property Type.
    await isPresent(propertyTypeState.enabledProductTypes, batchState.product, "an enabled Product Type for the Property Type")

    // Validation: The correct Property Value field is not set.
    await isCorrectFieldSet(propertyValue, propertyTypeState.dataType)

    // State update.
    const updates = {}

    // Check if the Property Type it has been recorded on the Batch.
    if (!batchState.properties.some(property => property.propertyType === propertyType))
        // Create a new Property and record on the Batch for the first time.
        batchState.properties.push(Batch.Property.create({
            propertyType: propertyType,
            values: [propertyValue]
        }))
    else {
        // Search for the Property.
        for (const property of batchState.properties) {
            // Update the value.
            if (property.propertyType === propertyType)
                property.values.push(propertyValue)
        }
    }

    // Update Batch.
    updates[batch] = Batch.encode(batchState).finish()

    await context.setState(updates)
}

/**
 * Handle Create Proposal transaction action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch The Batch state address.
 * @param {String} receiverCompany The receiver Company state address.
 * @param {String} notes A note for issuing the Proposal.
 */

async function createProposal(
    context,
    signerPublicKey,
    timestamp,
    {batch, receiverCompany, notes}
) {
    const operatorAddress = getOperatorAddress(signerPublicKey)

    let state = await context.getState([
        operatorAddress
    ])

    const operatorState = Operator.decode(state[operatorAddress])

    // Validation: The signer is not an Operator.
    if (operatorState.publicKey !== signerPublicKey)
        reject(`The signer is not an Operator`)

    const senderCompanyAddress = operatorState.company
    const batchAddress = batch

    state = await context.getState([
        batch,
        receiverCompany,
        senderCompanyAddress
    ])

    const senderCompanyState = Company.decode(state[senderCompanyAddress])
    const receiverCompanyState = Company.decode(state[receiverCompany])
    const batchState = Batch.decode(state[batch])

    // Validation: Batch doesn't match a sender Company Batch address.
    await isPresent(senderCompanyState.batches, batch, "a sender Company Batch")

    // Validation: The receiver Company address is not well-formatted or not exists.
    await checkStateAddresses(
        context,
        [receiverCompany],
        FULL_PREFIXES.COMPANY,
        "receiver Company"
    )

    // Validation: Batch product doesn't match an enabled Product Type for the receiver Company.
    await isPresent(receiverCompanyState.enabledProductTypes, batchState.product, "an enabled Product Type for the receiver Company")

    // Validation: Batch already has an issued Proposal.
    if (batchState.proposals.some(proposal => proposal.status === Proposal.Status.ISSUED))
        reject(`The provided batch ${batch} already has an issued Proposal!`)

    // State update.
    const updates = {}

    batchState.proposals.push(Proposal.create({
        senderCompany: senderCompanyAddress,
        receiverCompany: receiverCompany,
        status: Proposal.Status.ISSUED,
        notes: notes,
        timestamp: timestamp
    }))

    // Update Batch.
    updates[batchAddress] = Batch.encode(batchState).finish()

    await context.setState(updates)
}

/**
 * Handle Create Proposal transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The Operator public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch Batch identifier.
 * @param {String} senderCompany Sender Company identifier.
 * @param {String} receiverCompany Receiver Company identifier.
 * @param {Number} response status.
 * @param {String} motivation An optional text.
 */

async function answerProposal(
    context,
    signerPublicKey,
    timestamp,
    {batch, senderCompany, receiverCompany, response, motivation}
) {
    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`)

    // Validation: Sender Company is not set.
    if (!senderCompany)
        reject(`Sender company is not set!`)

    // Validation: Receiver Company is not set.
    if (!receiverCompany)
        reject(`Receiver company is not set!`)

    // Validation: Response is not set.
    if (!response)
        reject(`Response is not set!`)

    const operatorAddress = getOperatorAddress(signerPublicKey)

    let state = await context.getState([
        operatorAddress
    ])

    const operatorState = Operator.decode(state[operatorAddress])

    // Validation: Transaction signer is not an Operator for a Company.
    if (!state[operatorAddress].length)
        reject(`You must be an Operator for a Company!`)

    const senderCompanyAddress = getCompanyAddress(senderCompany)
    const receiverCompanyAddress = getCompanyAddress(receiverCompany)
    const batchAddress = getBatchAddress(batch)

    state = await context.getState([
        senderCompanyAddress,
        receiverCompanyAddress,
        batchAddress
    ])

    const senderCompanyState = Company.decode(state[senderCompanyAddress])
    const receiverCompanyState = Company.decode(state[receiverCompanyAddress])
    const batchState = Batch.decode(state[batchAddress])

    // Validation: Provided value for senderCompany does not match with a valid Company.
    if (!state[senderCompanyAddress].length > 0)
        reject(`The provided company ${senderCompany} is not a Company!`)

    // Validation: Provided value for receiverCompany does not match with a valid Company.
    if (!state[receiverCompanyAddress].length > 0)
        reject(`The provided company ${receiverCompany} is not a Company!`)

    // Validation: Provided value for batch does not match with a sender Company Batch.
    if (senderCompanyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`)

    // Validation: Provided value for response is not valid if Operator is not from sender Company.
    if (response === Proposal.Status.CANCELED && operatorState.company !== senderCompany)
        reject(`You must be an Operator from the sender Company to cancel a Proposal!`)

    // Validation: Provided value for response is not valid if Operator is not from receiver Company.
    if ((response === Proposal.Status.ACCEPTED || response === Proposal.Status.REJECTED) && operatorState.company !== receiverCompany)
        reject(`You must be an Operator from the receiver Company to accept or reject a Proposal!`)

    // Validation: Provided batch doesn't have at least an issued Proposals.
    if (batchState.proposals.every(proposal => proposal.status !== Proposal.Status.ISSUED))
        reject(`The provided batch ${batch} doesn't have at least an issued Proposals!`)

    // State update.
    const updates = {}

    // Get issued proposal
    let issuedProposal = null

    for (const proposal of batchState.proposals) {
        if (proposal.senderCompany === senderCompany &&
            proposal.receiverCompany === receiverCompany &&
            proposal.status === Proposal.Status.ISSUED)
            issuedProposal = proposal
    }

    issuedProposal.status = response

    // If operator is from receiver company.
    if (operatorState.company === receiverCompany && response === Proposal.Status.ACCEPTED) {
        // Add
        receiverCompanyState.batches.push(batch)

        // Remove
        senderCompanyState.batches.splice(senderCompanyState.batches.indexOf(batch), 1)

        // update batch.
        batchState.company = receiverCompany

        // Update Companies.
        updates[receiverCompanyAddress] = Company.encode(receiverCompanyState).finish()
        updates[senderCompanyAddress] = Company.encode(senderCompanyState).finish()

    }
    // Update Batch.
    updates[batchAddress] = Batch.encode(batchState).finish()

    await context.setState(updates)
}

/**
 * Handle Create Proposal transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The Operator public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch Batch identifier.
 * @param {Number} reason Reason.
 * @param {String} explanation explanation string.
 */

async function finalizeBatch(
    context,
    signerPublicKey,
    timestamp,
    {batch, reason, explanation}
) {
    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`)

    // Validation: Provided value for reason doesn't match the types specified in the Finalization's Reason.
    if (!Object.values(Batch.Finalization.Reason).some((value) => value === reason))
        reject(`Provided value for reason doesn't match any possible value!`)

    const operatorAddress = getOperatorAddress(signerPublicKey)

    let state = await context.getState([
        operatorAddress
    ])

    const operatorState = Operator.decode(state[operatorAddress])

    // Validation: Transaction signer is not an Operator for a Company.
    if (!state[operatorAddress].length)
        reject(`You must be an Operator for a Company!`)

    const companyAddress = getCompanyAddress(operatorState.company)
    const batchAddress = getBatchAddress(batch)

    state = await context.getState([
        companyAddress,
        batchAddress
    ])

    const companyState = Company.decode(state[companyAddress])
    const batchState = Batch.decode(state[batchAddress])

    // Validation: Provided value for batch does not match with a sender Company Batch.
    if (companyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`)

    // State update.
    const updates = {}

    batchState.finalization = Batch.Finalization.create({
        reason: reason,
        reporter: signerPublicKey,
        explanation: explanation
    })

    // Update Batch.
    updates[batchAddress] = Batch.encode(batchState).finish()

    await context.setState(updates)
}

module.exports = {
    addBatchCertificate,
    recordBatchProperty,
    createProposal,
    answerProposal,
    finalizeBatch
}
