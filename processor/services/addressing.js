'use strict';

const {getSHA512} = require('./utils');

const NAMESPACE = 'f4cb6d';
const FAMILY_NAME = 'AgriChain';
const VERSION = '0.1';
const PREFIXES = {
    // Entities.
    USERS: '00',
    TYPES: '01',
    COMPANY: '02',
    FIELD: '03',
    BATCH: '04',
    EVENT: '05'
};
const USER_PREFIXES = {
    SYSTEM_ADMIN: '10',
    COMPANY_ADMIN: '11',
    OPERATOR: '12',
    CERTIFICATION_AUTHORITY: '13'
};
const TYPE_PREFIXES = {
    TASK_TYPE: '20',
    PRODUCT_TYPE: '21',
    EVENT_PARAMETER_TYPE: '22',
    EVENT_TYPE: '23'
};

/**
 * Return an object containing a concatenation of namespace and prefix for each ones.
 */
const FULL_PREFIXES = Object.keys(PREFIXES).reduce((prefixes, key) => {
    prefixes[key] = NAMESPACE + PREFIXES[key];
    return prefixes
}, {});

// Return a full user address for a specific public key and prefix. 
const makeUsersAddress = (publicKey, userPrefix) =>
    FULL_PREFIXES.USERS +
    userPrefix +
    getSHA512(publicKey).slice(0, 60);

// Return a full type address for a specific public key and prefix.
const makeTypeAddress = (id, typePrefix) =>
    FULL_PREFIXES.TYPES +
    typePrefix +
    getSHA512(id).slice(0, 60);

/**
 * A function that takes a public key and returns the corresponding system admin
 * address.
 */
const getSystemAdminAddress = () => {
    return FULL_PREFIXES.USERS + USER_PREFIXES.SYSTEM_ADMIN + '0'.repeat(60)
};

/**
 * A function that takes a public key and returns the corresponding company admin
 * address.
 */
const getCompanyAdminAddress = publicKey => {
    return makeUsersAddress(publicKey, USER_PREFIXES.COMPANY_ADMIN)
};

/**
 * A function that takes a company owner public key and operator public key, returning the
 * corresponding operator address.
 */
const getOperatorAddress = publicKey => {
    return makeUsersAddress(publicKey, USER_PREFIXES.OPERATOR)
};

/**
 * A function that takes an id and returns the corresponding task type address.
 */
const getTaskTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.TASK_TYPE)
};

/**
 * A function that takes an id and returns the corresponding product type address.
 */
const getProductTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.PRODUCT_TYPE)
};

/**
 * A function that takes an id and returns the corresponding parameter type address.
 */
const getEventParameterTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.EVENT_PARAMETER_TYPE)
};

/**
 * A function that takes an id and returns the corresponding event type address.
 */
const getEventTypeAddress = id => {
    return makeTypeAddress(id, TYPE_PREFIXES.EVENT_TYPE)
};

/**
 * A function that takes an id and returns the corresponding company address.
 */
const getCompanyAddress = id => {
    return FULL_PREFIXES.COMPANY + getSHA512(id).slice(0, 62)
};

const getFieldAddress = id => {
    return FULL_PREFIXES.FIELD + getSHA512(id).slice(0, 62)
};

/**
 * A function that takes an address and returns true or false depending on
 * whether or not it is a valid address. It should reject an address if:
 *   - it is not a string
 *   - it is not 70 hex characters
 *   - it does not start with the correct namespace
 */
const isValidAddress = address => {
    const regExp = `^${NAMESPACE}[0-9A-Fa-f]{64}$`;
    return RegExp(regExp).test(address)
};

module.exports = {
    NAMESPACE,
    FAMILY_NAME,
    VERSION,
    PREFIXES,
    FULL_PREFIXES,
    USER_PREFIXES,
    TYPE_PREFIXES,
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getTaskTypeAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress,
    getCompanyAddress,
    getFieldAddress,
    isValidAddress
};
