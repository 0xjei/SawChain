'use strict'

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions')
const {createHash} = require('crypto')

/**
 * A quick convenience function to throw an InvalidTransaction error with a joined message.
 * @param {String} messages List of error messages to join together.
 */
const reject = (...messages) => {
    throw new InvalidTransaction(messages.join(' '))
}

/**
 * Return the SHA-512 hex string calculated from an input string.
 * @param {String} input Input string where hash is calculated.
 */
const calculateHash = (input) => {
    return createHash('sha512')
        .update(input)
        .digest('hex')
}

/**
 * Return an object that contains the decoded payload action field.
 * @param {Object} payload The decoded payload.
 * @param {String} actionField The wanted action field name.
 */
const getActionField = (payload, actionField) => {
    // Check if the SCPayload object contains the wanted action field name.
    if (!payload[actionField])
        reject(`Action payload is missing for ${actionField} action!`)

    return payload[actionField]
}

module.exports = {
    reject,
    calculateHash,
    getActionField
}