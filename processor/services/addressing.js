
const { createHash } = require('crypto')

/**
 * Return the SHA-512 hex string calculated from an input string sliced from 0 to len characters.
 * @param {String} input Input string where hash is calculated.
 * @param {Number} len The length of the output hash string.
 */
const hashAndSlice = (input, len) => {
  return createHash('sha512')
    .update(input)
    .digest('hex')
    .slice(0, len)
}

// SawChain Family metadata.
const FAMILY_NAME = 'SawChain'
const NAMESPACE = hashAndSlice(FAMILY_NAME, 6)
const VERSION = '0.1'

// Addressing state object prefixes.
const PREFIXES = {
  USERS: '00',
  TYPES: '01',
  COMPANY: '02',
  FIELD: '03',
  BATCH: '04',
}

// Addressing users state object prefixes.
const USER_PREFIXES = {
  SYSTEM_ADMIN: '10',
  COMPANY_ADMIN: '11',
  OPERATOR: '12',
  CERTIFICATION_AUTHORITY: '13',
}

// Addressing types state object prefixes.
const TYPE_PREFIXES = {
  TASK_TYPE: '20',
  PRODUCT_TYPE: '21',
  EVENT_PARAMETER_TYPE: '22',
  EVENT_TYPE: '23',
  PROPERTY_TYPE: '24',
}

/**
 * This object contains a string for the concatenation of each namespace with the related prefix.
 */
const FULL_PREFIXES = Object.keys(PREFIXES).reduce((prefixes, key) => {
  prefixes[key] = NAMESPACE + PREFIXES[key]
  return prefixes
}, {})

/**
 * Return a state full-address from a user prefix.
 * @param {String} prefix A prefix from pre-defined user prefixes list.
 * @param {String} publicKey The user public key.
 */
const getUserAddress = (prefix, publicKey) =>
  FULL_PREFIXES.USERS + prefix + hashAndSlice(publicKey, 60)

/**
 * Return a state full-address from a type prefix.
 * @param {String} prefix A prefix from pre-defined type prefixes list.
 * @param {String} id The unique identifier associated to the type.
 */
const getTypeAddress = (prefix, id) =>
  FULL_PREFIXES.TYPES + prefix + hashAndSlice(id, 60)

/**
 * Return the state full-address of the System Admin.
 */
const getSystemAdminAddress = () => {
  return FULL_PREFIXES.USERS + USER_PREFIXES.SYSTEM_ADMIN + '0'.repeat(60)
}

/**
 * Return the state full-address of a Company Admin.
 * @param {String} publicKey The Company Admin public key.
 */
const getCompanyAdminAddress = publicKey => {
  return getUserAddress(USER_PREFIXES.COMPANY_ADMIN, publicKey)
}

/**
 * Return the state full-address of an Operator.
 * @param {String} publicKey The Operator public key.
 */
const getOperatorAddress = publicKey => {
  return getUserAddress(USER_PREFIXES.OPERATOR, publicKey)
}

/**
 * Return the state full-address of a Certification Authority.
 * @param {String} publicKey The Certification Authority public key.
 */
const getCertificationAuthorityAddress = publicKey => {
  return getUserAddress(USER_PREFIXES.CERTIFICATION_AUTHORITY, publicKey)
}

/**
 * Return the state full-address of a Task Type.
 * @param {String} id The Task Type unique identifier.
 */
const getTaskTypeAddress = id => {
  return getTypeAddress(TYPE_PREFIXES.TASK_TYPE, id)
}

/**
 * Return the state full-address of a Product Type.
 * @param {String} id The Product Type unique identifier.
 */
const getProductTypeAddress = id => {
  return getTypeAddress(TYPE_PREFIXES.PRODUCT_TYPE, id)
}

/**
 * Return the state full-address of a Event Parameter Type.
 * @param {String} id The Event Parameter Type unique identifier.
 */
const getEventParameterTypeAddress = id => {
  return getTypeAddress(TYPE_PREFIXES.EVENT_PARAMETER_TYPE, id)
}

/**
 * Return the state full-address of a Event Type.
 * @param {String} id The Event Type unique identifier.
 */
const getEventTypeAddress = id => {
  return getTypeAddress(TYPE_PREFIXES.EVENT_TYPE, id)
}

/**
 * Return the state full-address of a Property Type.
 * @param {String} id The Property Type unique identifier.
 */
const getPropertyTypeAddress = id => {
  return getTypeAddress(TYPE_PREFIXES.PROPERTY_TYPE, id)
}

/**
 * Return the state full-address of a Company.
 * @param {String} id The Company unique identifier.
 */
const getCompanyAddress = id => {
  return FULL_PREFIXES.COMPANY + hashAndSlice(id, 62)
}

/**
 * Return the state full-address of a Field.
 * @param {String} id The Field unique identifier.
 * @param {String} company The Company unique identifier.
 */
const getFieldAddress = (id, company) => {
  return FULL_PREFIXES.FIELD + hashAndSlice(id, 42) + hashAndSlice(company, 20)
}

/**
 * Return the state full-address of a Batch.
 * @param {String} id The Batch unique identifier.
 */
const getBatchAddress = (id) => {
  return FULL_PREFIXES.BATCH + hashAndSlice(id, 62)
}

/**
 * Return true or false depending on whether or not the given state address is a valid address.
 * It should reject an address if it's not a string or not 70 hex characters, and if it doesn't start with SawChain
 * namespace.
 * @param {String} address The state address to be validated.
 */
const isValidAddress = address => {
  const regExp = `^${NAMESPACE}[0-9A-Fa-f]{64}$`

  return RegExp(regExp).test(address)
}

module.exports = {
  NAMESPACE,
  FAMILY_NAME,
  VERSION,
  PREFIXES,
  USER_PREFIXES,
  TYPE_PREFIXES,
  FULL_PREFIXES,
  getSystemAdminAddress,
  getCompanyAdminAddress,
  getOperatorAddress,
  getCertificationAuthorityAddress,
  getTaskTypeAddress,
  getProductTypeAddress,
  getEventParameterTypeAddress,
  getEventTypeAddress,
  getPropertyTypeAddress,
  getCompanyAddress,
  getFieldAddress,
  getBatchAddress,
  isValidAddress,
  hashAndSlice,
}
