'use strict'

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions')
const {isValidAddress} = require('./addressing')

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
    if (!payload[actionField])
        reject(`Action payload is missing for ${actionField} action.`)

    return payload[actionField]
}

/**
 * Return true or false depending on whether or not the given value is a valid public key.
 * It should reject an address if it's not a string or not 66 hex characters.
 * @param {String} publicKey The string to evaluate.
 */
const isValidPublicKey = (publicKey) => {
    return RegExp(`^[0-9A-Fa-f]{66}$`).test(publicKey)
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
        if (!isValidAddress(address) || !address.startsWith(start))
            reject(`${object} is not a valid 70-char hex string address: ${address}`)

        const state = await context.getState([address])

        // Validation: At least one specified address is empty.
        if (state[address].length === 0)
            reject(`Specified ${object} does not exist: ${address}`)
    }
}

module.exports = {
    reject,
    getActionField,
    isValidPublicKey,
    checkStateAddresses
}
