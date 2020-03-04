'use strict'

const {getSHA512} = require('./utils')

const FAMILY_NAME = 'SawChain'
const NAMESPACE = getSHA512(FAMILY_NAME, 6)
const VERSION = '0.1'

const PREFIXES = {
    USERS: '00',
    TYPES: '01',
    COMPANY: '02',
    FIELD: '03',
    BATCH: '04'
}
const USER_PREFIXES = {
    SYSTEM_ADMIN: '10',
    COMPANY_ADMIN: '11',
    OPERATOR: '12',
    CERTIFICATION_AUTHORITY: '13'
}
const TYPE_PREFIXES = {
    TASK_TYPE: '20',
    PRODUCT_TYPE: '21',
    EVENT_PARAMETER_TYPE: '22',
    EVENT_TYPE: '23',
    PROPERTY_TYPE: '24'
}

/**
 * Object containing strings obtained by concatenation of namespaces and prefixes.
 */
const FULL_PREFIXES =
    Object.keys(PREFIXES).reduce((prefixes, key) => {
        prefixes[key] = NAMESPACE + PREFIXES[key]
        return prefixes
    }, {})

/**
 * Return a full-address using a prefix of a user state object.
 * @param {String} publicKey User public key.
 * @param {String} prefix A prefix from USER_PREFIXES object.
 */
const makeUserAddress = (publicKey, prefix) =>
    FULL_PREFIXES.USERS + prefix + getSHA512(publicKey, 60)

/**
 * Return a full-address using a prefix of a type state object.
 * @param {String} id Unique type identifier.
 * @param {String} prefix A prefix from TYPE_PREFIXES object.
 */
const makeTypeAddress = (id, prefix) =>
    FULL_PREFIXES.TYPES + prefix + getSHA512(id, 60)

/**
 * Return the SystemAdmin state address.
 */
const getSystemAdminAddress = () => {
    return FULL_PREFIXES.USERS + USER_PREFIXES.SYSTEM_ADMIN + '0'.repeat(60)
}

/**
 * Return a CompanyAdmin state address.
 * @param {String} publicKey The CompanyAdmin's public key.
 */
const getCompanyAdminAddress = publicKey => {
    return makeUserAddress(publicKey, USER_PREFIXES.COMPANY_ADMIN)
}

/**
 * Return an Operator state address.
 * @param {String} publicKey The Operator's public key.
 */
const getOperatorAddress = publicKey => {
    return makeUserAddress(publicKey, USER_PREFIXES.OPERATOR)
}

/**
 * Return a CertificationAuthority state address.
 * @param {String} publicKey The CertificationAuthority's public key.
 */
const getCertificationAuthorityAddress = publicKey => {
    return makeUserAddress(publicKey, USER_PREFIXES.CERTIFICATION_AUTHORITY)
}

/**
 * Return a TaskType state address.
 * @param {String} id The TaskType's unique identifier.
 */
const getTaskTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.TASK_TYPE)
}

/**
 * Return a ProductType state address.
 * @param {String} id The ProductType's unique identifier.
 */
const getProductTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.PRODUCT_TYPE)
}

/**
 * Return a EventParameterType state address.
 * @param {String} id The EventParameterType's unique identifier.
 */
const getEventParameterTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.EVENT_PARAMETER_TYPE)
}

/**
 * Return a EventType state address.
 * @param {String} id The EventType's unique identifier.
 */
const getEventTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.EVENT_TYPE)
}

/**
 * Return a PropertyType state address.
 * @param {String} id The PropertyType's unique identifier.
 */
const getPropertyTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.PROPERTY_TYPE)
}

/**
 * Return a Company state address.
 * @param {String} id The Company's unique identifier.
 */
const getCompanyAddress = id => {
    return FULL_PREFIXES.COMPANY + getSHA512(id, 62)
}

/**
 * Return a company Field state address.
 * @param {String} id The Field's unique identifier.
 * @param {String} company The Company's unique identifier.
 */
const getFieldAddress = (id, company) => {
    return FULL_PREFIXES.FIELD + getSHA512(id, 42) + getSHA512(company, 20)
}

/**
 * Return a Batch state address.
 * @param {String} id The Batch's unique identifier.
 */
const getBatchAddress = (id) => {
    return FULL_PREFIXES.BATCH + getSHA512(id, 62)
}

/**
 * Return true or false depending on whether or not the given state address is a valid address.
 * It should reject an address if it's not a string or not 70 hex characters, and if it doesn't start with SawChain
 * namespace.
 * @param {String} address A state address to validate.
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
    isValidAddress
}
