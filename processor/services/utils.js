
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const {
  getSystemAdminAddress,
  getOperatorAddress,
  getCompanyAdminAddress,
  getCertificationAuthorityAddress,
  isValidAddress,
} = require('./addressing')
const {
  SystemAdmin,
} = require('./proto')

/**
 * A quick convenience function to throw an InvalidTransaction error with a joined message.
 * @param {String} messages List of error messages to join together.
 */
const reject = (...messages) => {
  throw new InvalidTransaction(messages.join(' '))
}

/**
 * Return an object that contains the decoded payload action field.
 * @param {Object} payload The decoded payload.
 * @param {String} actionField The wanted action field name.
 */
const getActionField = (payload, actionField) => {
  // Check if the SCPayload object contains the wanted action field name.
  if (!payload[actionField]) { reject(`Action payload is missing for ${actionField} action.`) }

  return payload[actionField]
}

/**
 * Return true or false depending on whether or not the given value is a valid public key.
 * It should reject an address if it's not a string or not 66 hex characters.
 * @param {String} publicKey The string to evaluate.
 */
const isValidPublicKey = (publicKey) => {
  return RegExp('^[0-9A-Fa-f]{66}$').test(publicKey)
}

/**
 * Check if at least one state address is not a valid address or is empty from an addresses lists.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String[]} addresses The state addresses to verify.
 * @param {String} start The starting string used to check a particular subset of state objects.
 * @param {String} object The name of the state object.
 */
const checkStateAddresses = async (context, addresses, start, object) => {
  for (const address of addresses) {
    // Validation: At least one state address is not a valid address.
    if (!isValidAddress(address) || !address.startsWith(start)) { reject(`${object} is not a valid 70-char hex string address: ${address}`) }

    const state = await context.getState([address])

    // Validation: At least one specified address is empty.
    if (state[address].length === 0) { reject(`Specified ${object} does not exist: ${address}`) }
  }
}

/**
 * Check if the public key is already associated with a user into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} publicKey The public key to verify.
 */
const isPublicKeyUsed = async (context, publicKey) => {
  const systemAdminAddress = getSystemAdminAddress()
  const companyAdminAddress = getCompanyAdminAddress(publicKey)
  const operatorAddress = getOperatorAddress(publicKey)
  const certificationAuthorityAddress = getCertificationAuthorityAddress(publicKey)

  const state = await context.getState([
    systemAdminAddress,
    companyAdminAddress,
    operatorAddress,
    certificationAuthorityAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The public key belongs to another authorized user.
  if (systemAdminState.publicKey === publicKey) { reject('The public key belongs to the current System Admin') }

  if (state[companyAdminAddress].length > 0) { reject('The public key belongs to a Company Admin') }

  if (state[operatorAddress].length > 0) { reject('The public key belongs to an Operator') }

  if (state[certificationAuthorityAddress].length > 0) { reject('The public key belongs to a Certification Authority') }
}

/**
 * Check if an address is contained in the given list.
 * @param {String[]} list A list of state addresses.
 * @param {String} address A state address.
 * @param {String} object The name of the state object.
 */
const isPresent = async (list, address, object) => {
  // Validation: Provided address is not in the list.
  if (list.indexOf(address) === -1) { reject(`Provided address ${address} doesn't match ${object}`) }
}

module.exports = {
  reject,
  getActionField,
  isValidPublicKey,
  checkStateAddresses,
  isPublicKeyUsed,
  isPresent,
}
