'use strict'

const {
    Operator,
    CertificationAuthority,
    PropertyType,
    Company,
    Batch,
    Certificate,
    TypeData
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
    FULL_PREFIXES
} = require('../services/addressing')

/**
 * Check if a value for a property is valid.
 * @param {Object} value PropertyValue object provided by the Operator.
 * @param {Object} type PropertyType type (Temperature, Location).
 */
const checkField = (value, type) => {
    switch (type) {
        // Number Property.
        case TypeData.Type.NUMBER:
            // Validation: No correct value field is provided for temperature type property.
            if (value.floatValue === 0.0)
                reject(`No correct value field is provided for property of type ${type}!`)

            break

        // String Property.
        case TypeData.Type.STRING:
            // Validation: No correct value field is provided for location type property.
            if (value.stringValue.length === 0)
                reject(`No correct value field is provided for property of type ${type}!`)

            break

        // String Property.
        case TypeData.Type.BYTES:
            // Validation: No correct value field is provided for location type property.
            if (!value.bytesValue.length > 0)
                reject(`No correct value field is provided for property of type ${type}!`)

            break

        // String Property.
        case TypeData.Type.LOCATION:
            // Validation: No correct value field is provided for location type property.
            if (!value.locationValue)
                reject(`No correct value field is provided for property of type ${type}!`)

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

    // Validation: At least one Company address is not well-formatted or not exists.
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
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The Operator public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch Batch identifier.
 * @param {String} property PropertyType identifier.
 * @param {Object} propertyValue A PropertyValue used to update the Property list of values.
 */
async function recordBatchProperty(
    context,
    signerPublicKey,
    timestamp,
    {batch, property, propertyValue}
) {
    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`)

    // Validation: Property is not set.
    if (!property)
        reject(`Property is not set!`)

    // Validation: PropertyValue is not set.
    if (!propertyValue)
        reject(`Property Value is not set!`)

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
    const propertyTypeAddress = getPropertyTypeAddress(property)

    state = await context.getState([
        propertyTypeAddress,
        companyAddress,
        batchAddress
    ])

    const propertyTypeState = PropertyType.decode(state[propertyTypeAddress])
    const companyState = Company.decode(state[companyAddress])
    const batchState = Batch.decode(state[batchAddress])

    // Validation: Provided value for batch does not match with a Company Batch.
    if (companyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`)

    // Validation: Provided value for property type id in property value doesn't match with a valid Property Type.
    if (!state[propertyTypeAddress].length > 0)
        reject(`Provided Property Type id ${property} doesn't match with a valid Property Type!`)

    // Validation: Operator's task doesn't match one of the enabled Task Types for the Property Type.
    if (!(propertyTypeState.enabledTaskTypes.indexOf(operatorState.task) > -1))
        reject(`You cannot record this Property with a ${operatorState.task} task!`)

    // Validation: Batch Product Type doesn't match one of the enabled Product Types for the Property Type.
    if (propertyTypeState.enabledProductTypes.indexOf(batchState.product) === -1)
        reject(`You cannot record this Property on ${batch} Batch!`)

    // Validation: Check property value.
    checkField(propertyValue, propertyTypeState.type)

    // State update.
    const updates = {}

    if (!batchState.properties.some(propertyObj => propertyObj.propertyTypeId === property))
        batchState.properties.push(Batch.Property.create({
            propertyTypeId: property,
            values: [propertyValue]
        }))
    else {
        for (const propertyList of batchState.properties) {
            if ((propertyList).propertyTypeId === property) {
                (propertyList).values.push(propertyValue)
            }
        }
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
 * @param {String} receiverCompany Receiver Company identifier.
 * @param {String} notes An optional text.
 */

async function createProposal(
    context,
    signerPublicKey,
    timestamp,
    {batch, receiverCompany, notes}
) {
    // Validation: Batch is not set.
    if (!batch)
        reject(`Batch is not set!`)

    // Validation: Receiver Company is not set.
    if (!receiverCompany)
        reject(`Receiver company is not set!`)

    const operatorAddress = getOperatorAddress(signerPublicKey)

    let state = await context.getState([
        operatorAddress
    ])

    const operatorState = Operator.decode(state[operatorAddress])

    // Validation: Transaction signer is not an Operator for a Company.
    if (!state[operatorAddress].length)
        reject(`You must be an Operator for a Company!`)

    const senderCompanyAddress = getCompanyAddress(operatorState.company)
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

    // Validation: Provided value for batch does not match with a Company Batch.
    if (senderCompanyState.batches.indexOf(batch) === -1)
        reject(`The provided batch ${batch} is not a Company Batch!`)

    // Validation: Provided value for receiverCompany does not match with a valid Company.
    if (!state[receiverCompanyAddress].length > 0)
        reject(`The provided company ${receiverCompany} is not a Company!`)

    // Validation: Batch Product Type doesn't match one of the enabled Product Types for the receiver Company.
    if (!(receiverCompanyState.enabledProductTypes.indexOf(batchState.product) > -1))
        reject(`You cannot create a proposal for provided receiver Company on ${batch} Batch!`)

    // Validation: Provided batch already has a issued Proposal.
    if (batchState.proposals.some(proposal => proposal.status === Proposal.Status.ISSUED))
        reject(`The provided batch ${batch} already has an issued Proposal!`)

    // State update.
    const updates = {}

    batchState.proposals.push(Proposal.create({
        senderCompany: operatorState.company,
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
