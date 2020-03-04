'use strict'

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions')
const {createHash} = require('crypto')
const secp256k1 = require('sawtooth-sdk/signing/secp256k1')

/**
 * A quick convenience function to throw a InvalidTransaction error with a joined message.
 * @param {String} messages List of error messages to join together.
 */
const reject = (...messages) => {
    throw new InvalidTransaction(messages.join(' '))
}

/**
 * Return a SHA-512 hex-string. The string can be sliced to a particular length.
 * @param {String} str Input string.
 * @param {Number} length Number of characters for the output string.
 */
const getSHA512 = (str, length) => {
    return createHash('sha512')
        .update(str)
        .digest('hex')
        .slice(0, length)
}

/**
 * Return a new key-pair using secp256k1 context generator.
 */
const getNewKeyPair = () => {
    // Initialize a new context with a random seed.
    const secp256k1Context = new secp256k1.Secp256k1Context()

    // Generate a new private key.
    let privateKey = secp256k1Context.newRandomPrivateKey()

    // Get the public key from the private key
    let publicKey = secp256k1Context.getPublicKey(privateKey)

    // Convert keys to hexadecimal strings.
    privateKey = privateKey.asHex()
    publicKey = publicKey.asHex()

    return {privateKey, publicKey}
}

/**
 * Return an object that contains the decoded payload action field.
 * @param {Object} payload The decoded payload.
 * @param {String} actionFieldName Expected action field name.
 */
const getActionFieldFromPayload = (payload, actionFieldName) => {
    // Check if the SCPayload object contains provided action field name.
    if (!payload[actionFieldName])
        reject(`Action payload is missing for ${actionFieldName} action!`)

    return payload[actionFieldName]
}

module.exports = {
    reject,
    getSHA512,
    getNewKeyPair,
    getActionFieldFromPayload
}