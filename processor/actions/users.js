
const {
  SystemAdmin,
  CompanyAdmin,
  Operator,
  CertificationAuthority,
  Company,
} = require('../services/proto')
const {
  reject,
  isValidPublicKey,
  checkStateAddresses,
  isPublicKeyUsed,
} = require('../services/utils')
const {
  getSystemAdminAddress,
  getCompanyAdminAddress,
  getOperatorAddress,
  getCertificationAuthorityAddress,
  FULL_PREFIXES,
  TYPE_PREFIXES,
} = require('../services/addressing')

/**
 * Record the System Admin into the state.
 * The signerPublicKey in the transaction header is used as the System Admin's public key.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 */
async function createSystemAdmin (context, signerPublicKey, timestamp) {
  const systemAdminAddress = getSystemAdminAddress()

  const state = await context.getState([systemAdminAddress])

  // Validation: System Admin is already recorded.
  if (state[systemAdminAddress].length > 0) { reject('The System Admin is already recorded') }

  // State update.
  const updates = {}

  updates[systemAdminAddress] = SystemAdmin.encode({
    publicKey: signerPublicKey,
    timestamp: timestamp,
  }).finish()

  await context.setState(updates)
}

/**
 * Change the System Admin replacing the public key stored in the System Admin state address.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The current System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} publicKey The new System Admin public key.
 */
async function updateSystemAdmin (context, signerPublicKey, timestamp, { publicKey }) {
  // Validation: Public key field doesn't contain a valid public key.
  if (!isValidPublicKey(publicKey)) { reject('The public key field doesn\'t contain a valid public key') }

  const systemAdminAddress = getSystemAdminAddress()

  const state = await context.getState([systemAdminAddress])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The public key belongs to another authorized user.
  await isPublicKeyUsed(context, publicKey)

  // State update.
  const updates = {}

  updates[systemAdminAddress] = SystemAdmin.encode({
    publicKey: publicKey,
    timestamp: timestamp,
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Operator into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey A Company Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} publicKey The Operator public key.
 * @param {String} task Task Type identifier for Operator task.
 */
async function createOperator (
  context,
  signerPublicKey,
  timestamp,
  { publicKey, task },
) {
  // Validation: Public key field doesn't contain a valid public key.
  if (!isValidPublicKey(publicKey)) { reject('The public key field doesn\'t contain a valid public key') }

  const companyAdminAddress = getCompanyAdminAddress(signerPublicKey)
  const operatorAddress = getOperatorAddress(publicKey)

  let state = await context.getState([
    companyAdminAddress,
  ])

  const companyAdminState = CompanyAdmin.decode(state[companyAdminAddress])

  // Validation: The signer is not a Company Admin.
  if (companyAdminState.publicKey !== signerPublicKey) { reject('You must be a Company Admin with a Company to create an Operator') }

  // Validation: At least one Task Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [task],
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.TASK_TYPE,
    'Task Type',
  )

  // Validation: The public key belongs to another authorized user.
  await isPublicKeyUsed(context, publicKey)

  state = await context.getState([
    companyAdminState.company,
  ])

  const companyState = Company.decode(state[companyAdminState.company])

  // State update.
  const updates = {}

  updates[operatorAddress] = Operator.encode({
    publicKey: publicKey,
    company: companyAdminState.company,
    task: task,
    timestamp: timestamp,
  }).finish()

  // Update company.
  companyState.operators.push(publicKey)
  updates[companyAdminState.company] = Company.encode(companyState).finish()

  await context.setState(updates)
}

/**
 * Record a new Certification Authority into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The current System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} publicKey The Certification Authority public key.
 * @param {String} name The Certification Authority name.
 * @param {String} website The Certification Authority website.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the certificate can be recorded.
 */
async function createCertificationAuthority (
  context,
  signerPublicKey,
  timestamp,
  { publicKey, name, website, enabledProductTypes },
) {
  // Validation: Public key field doesn't contain a valid public key.
  if (!isValidPublicKey(publicKey)) { reject('The public key field doesn\'t contain a valid public key') }

  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: No website specified.
  if (!website) { reject('No website specified') }

  const systemAdminAddress = getSystemAdminAddress()

  const state = await context.getState([systemAdminAddress])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The public key belongs to another authorized user.
  await isPublicKeyUsed(context, publicKey)

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledProductTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  // State update.
  const updates = {}

  updates[getCertificationAuthorityAddress(publicKey)] = CertificationAuthority.encode({
    publicKey: publicKey,
    name: name,
    website: website,
    enabledProductTypes: enabledProductTypes,
    timestamp: timestamp,
  }).finish()

  await context.setState(updates)
}

module.exports = {
  createSystemAdmin,
  updateSystemAdmin,
  createOperator,
  createCertificationAuthority,
}
