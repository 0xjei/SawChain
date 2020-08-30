
const {
  Operator,
  CertificationAuthority,
  PropertyType,
  Company,
  Batch,
  Proposal,
  Certificate,
  Shared,
} = require('../services/proto')
const {
  reject,
  checkStateAddresses,
  isPresent,
} = require('../services/utils')
const {
  getOperatorAddress,
  getCertificationAuthorityAddress,
  FULL_PREFIXES,
  TYPE_PREFIXES,
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
    ) { reject('The number value field is not specified') }
    break

    // String data type.
  case Shared.DataType.STRING:
    // Validation: The string value field is not specified.
    if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.bytesValue.length > 0 ||
                propertyValue.locationValue
    ) { reject('The string value field is not specified') }
    break

    // Bytes data type.
  case Shared.DataType.BYTES:
    // Validation: The bytes value field is not specified.
    if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.stringValue.length > 0 ||
                propertyValue.locationValue
    ) { reject('The bytes value field is not specified') }
    break

    // Location data type.
  case Shared.DataType.LOCATION:
    // Validation: The location value field is not specified.
    if (propertyValue.numberValue > 0 ||
                propertyValue.numberValue < 0 ||
                propertyValue.stringValue.length > 0 ||
                propertyValue.bytesValue.length > 0
    ) { reject('The location value field is not specified') }
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
async function addBatchCertificate (
  context,
  signerPublicKey,
  timestamp,
  { batch, company, link, hash },
) {
  // Validation: No link specified.
  if (!link) { reject('No link specified') }

  // Validation: Hash is not a valid SHA-512 string.
  if (!RegExp('^[0-9A-Fa-f]{128}$').test(hash)) { reject('Hash is not a valid SHA-512 string') }

  const certificationAuthorityAddress = getCertificationAuthorityAddress(signerPublicKey)

  const state = await context.getState([
    certificationAuthorityAddress,
    company,
    batch,
  ])

  const certificationAuthorityState = CertificationAuthority.decode(state[certificationAuthorityAddress])
  const companyState = Company.decode(state[company])
  const batchState = Batch.decode(state[batch])

  // Validation: The signer is not a Certification Authority.
  if (certificationAuthorityState.publicKey !== signerPublicKey) { reject('The signer is not a Certification Authority') }

  // Validation: The Company address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [company],
    FULL_PREFIXES.COMPANY,
    'Company',
  )

  // Validation: Batch doesn't match a Company Batch address.
  await isPresent(companyState.batches, batch, 'a Company Batch')

  // Validation: Batch product doesn't match an enabled Certification Authority Product Type.
  await isPresent(
    certificationAuthorityState.enabledProductTypes,
    batchState.product,
    'an enabled Certification Authority Product Type',
  )

  // Validation: The Batch is finalized.
  if (batchState.finalization) { reject('The Batch is finalized') }

  // State update.
  const updates = {}

  // Record Certificate on the Batch.
  batchState.certificates.push(Certificate.create({
    authority: signerPublicKey,
    link: link,
    hash: hash,
    timestamp: timestamp,
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
async function recordBatchProperty (
  context,
  signerPublicKey,
  timestamp,
  { batch, propertyType, propertyValue },
) {
  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([
    operatorAddress,
  ])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const companyAddress = operatorState.company

  state = await context.getState([
    companyAddress,
    propertyType,
    batch,
  ])

  const propertyTypeState = PropertyType.decode(state[propertyType])
  const companyState = Company.decode(state[companyAddress])
  const batchState = Batch.decode(state[batch])

  // Validation: Batch doesn't match a Company Batch address.
  await isPresent(companyState.batches, batch, 'a Company Batch')

  // Validation: The Property Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [propertyType],
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PROPERTY_TYPE,
    'Property Type',
  )

  // Validation: Operator task doesn't match an enabled Task Type for the Property Type.
  await isPresent(propertyTypeState.enabledTaskTypes, operatorState.task, 'an enabled Task Type for the Property Type')

  // Validation: Batch product doesn't match an enabled Product Type for the Property Type.
  await isPresent(propertyTypeState.enabledProductTypes, batchState.product, 'an enabled Product Type for the Property Type')

  // Validation: The Batch is finalized.
  if (batchState.finalization) { reject('The Batch is finalized') }

  // Validation: The correct Property Value field is not set.
  await isCorrectFieldSet(propertyValue, propertyTypeState.dataType)

  // State update.
  const updates = {}

  // Check if the Property Type it has been recorded on the Batch.
  if (!batchState.properties.some(property => property.propertyType === propertyType)) {
    // Create a new Property and record on the Batch for the first time.
    batchState.properties.push(Batch.Property.create({
      propertyType: propertyType,
      values: [propertyValue],
    }))
  } else {
    // Search for the Property.
    for (const property of batchState.properties) {
      // Update the value.
      if (property.propertyType === propertyType) { property.values.push(propertyValue) }
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

async function createProposal (
  context,
  signerPublicKey,
  timestamp,
  { batch, receiverCompany, notes },
) {
  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([
    operatorAddress,
  ])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const senderCompanyAddress = operatorState.company
  const batchAddress = batch

  state = await context.getState([
    batch,
    receiverCompany,
    senderCompanyAddress,
  ])

  const senderCompanyState = Company.decode(state[senderCompanyAddress])
  const receiverCompanyState = Company.decode(state[receiverCompany])
  const batchState = Batch.decode(state[batch])

  // Validation: Batch doesn't match a sender Company Batch address.
  await isPresent(senderCompanyState.batches, batch, 'a sender Company Batch')

  // Validation: The receiver Company address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [receiverCompany],
    FULL_PREFIXES.COMPANY,
    'receiver Company',
  )

  // Validation: Batch product doesn't match an enabled Product Type for the receiver Company.
  await isPresent(receiverCompanyState.enabledProductTypes, batchState.product, 'an enabled Product Type for the receiver Company')

  // Validation: The Batch is finalized.
  if (batchState.finalization) { reject('The Batch is finalized') }

  // Validation: Batch already has an issued Proposal.
  if (batchState.proposals.some(proposal => proposal.status === Proposal.Status.ISSUED)) { reject(`The provided batch ${batch} already has an issued Proposal!`) }

  // State update.
  const updates = {}

  batchState.proposals.push(Proposal.create({
    senderCompany: senderCompanyAddress,
    receiverCompany: receiverCompany,
    status: Proposal.Status.ISSUED,
    notes: notes,
    timestamp: timestamp,
  }))

  // Update Batch.
  updates[batchAddress] = Batch.encode(batchState).finish()

  await context.setState(updates)
}

/**
 * Handle Answer Proposal transaction action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch The Batch state address.
 * @param {String} senderCompany The sender Company state address.
 * @param {Number} response The new Proposal status.
 * @param {String} motivation A motivation to answer the Proposal.
 */
async function answerProposal (
  context,
  signerPublicKey,
  timestamp,
  { batch, senderCompany, response, motivation },
) {
  // Validation: Response doesn't match one any possible value.
  if (!Object.values(Proposal.Status).some((status) => status === response)) { reject('Response doesn\'t match one any possible value') }

  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([
    operatorAddress,
  ])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const receiverCompanyAddress = operatorState.company

  state = await context.getState([
    senderCompany,
    receiverCompanyAddress,
    batch,
  ])

  const senderCompanyState = Company.decode(state[senderCompany])
  const receiverCompanyState = Company.decode(state[receiverCompanyAddress])
  const batchState = Batch.decode(state[batch])

  // Validation: The sender Company address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [senderCompany],
    FULL_PREFIXES.COMPANY,
    'sender Company',
  )

  // Validation: Batch doesn't match a sender Company Batch address.
  await isPresent(senderCompanyState.batches, batch, 'a sender Company Batch')

  // Validation: Batch doesn't have an issued Proposals.
  if (batchState.proposals.every(proposal => proposal.status !== Proposal.Status.ISSUED)) { reject('Batch doesn\'t have an issued Proposals') }

  // Validation: Operator from receiver Company cannot answer cancel status for Proposal.
  if (response === Proposal.Status.CANCELED && receiverCompanyAddress !== senderCompany) { reject('Operator from receiver Company answer cancel status for Proposal') }

  // Validation: Operator from sender Company cannot answer accepted or rejected status for Proposal.
  if ((response === Proposal.Status.ACCEPTED || response === Proposal.Status.REJECTED) && receiverCompanyAddress === senderCompany) { reject('Operator from sender Company cannot answer accepted or rejected status for Proposal') }

  // State update.
  const updates = {}

  let issuedProposal = null

  // Check if the Operator is from sender or receiver Company.
  if (receiverCompanyAddress !== senderCompany) {
    issuedProposal = batchState.proposals.filter(proposal =>
      proposal.status === Proposal.Status.ISSUED &&
            proposal.receiverCompany === receiverCompanyAddress &&
            proposal.senderCompany === senderCompany,
    )[0]
  } else {
    issuedProposal = batchState.proposals.filter(proposal =>
      proposal.status === Proposal.Status.ISSUED,
    )[0]
  }

  // Update the Proposal status and motivation.
  issuedProposal.status = response
  issuedProposal.motivation = motivation

  // If operator is from receiver company.
  if (response === Proposal.Status.ACCEPTED) {
    // Update the Batch Company reference address.
    batchState.company = receiverCompanyAddress

    // Add the Batch to the receiver Company.
    receiverCompanyState.batches.push(batch)

    // Remove the Batch from the sender Company
    senderCompanyState.batches.splice(senderCompanyState.batches.indexOf(batch), 1)

    // Update Companies.
    updates[receiverCompanyAddress] = Company.encode(receiverCompanyState).finish()
    updates[senderCompany] = Company.encode(senderCompanyState).finish()
  }

  // Update Batch.
  updates[batch] = Batch.encode(batchState).finish()

  await context.setState(updates)
}

/**
 * Handle a Finalize Batch action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The Certification Authority public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} batch The Batch state address.
 * @param {Number} reason The Batch finalization reason.
 * @param {String} explanation A short explanation for the finalization.
 */
async function finalizeBatch (
  context,
  signerPublicKey,
  timestamp,
  { batch, reason, explanation },
) {
  // Validation: Reason doesn't match one any possible value.
  if (!Object.values(Batch.Finalization.Reason).some((value) => value === reason)) { reject('Reason doesn\'t match one any possible value') }

  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([
    operatorAddress,
  ])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const companyAddress = operatorState.company

  state = await context.getState([
    companyAddress,
    batch,
  ])

  const companyState = Company.decode(state[companyAddress])
  const batchState = Batch.decode(state[batch])

  // Validation: Batch doesn't match a Company Batch address.
  await isPresent(companyState.batches, batch, 'a Company Batch')

  // Validation: Batch has an issued Proposal.
  if (batchState.proposals.some(proposal => proposal.status === Proposal.Status.ISSUED)) { reject('You cannot finalize a Batch with an issued Proposal') }

  // Validation: The Batch has already been finalized.
  if (batchState.finalization) { reject('The Batch has already been finalized') }

  // State update.
  const updates = {}

  batchState.finalization = Batch.Finalization.create({
    reason: reason,
    reporter: signerPublicKey,
    explanation: explanation,
  })

  // Update Batch.
  updates[batch] = Batch.encode(batchState).finish()

  await context.setState(updates)
}

module.exports = {
  addBatchCertificate,
  recordBatchProperty,
  createProposal,
  answerProposal,
  finalizeBatch,
}
