
const { createHash } = require('crypto')
const { TransactionHeader } = require('sawtooth-sdk/protobuf')
const { NAMESPACE, FAMILY_NAME, VERSION } = require('../../services/addressing')
const { SCPayload } = require('../../services/proto')
const { Secp256k1Context, Secp256k1PrivateKey } = require('sawtooth-sdk/signing/secp256k1')

/**
 * A wrapper class for SawChain Transaction.
 * (nb. The wrapper class purpose is to simulate the Sawtooth blockchain in order to speed up tests development).
 */
class Txn {
  /**
     * Create a new transaction object.
     * @param {Object} payload Action handling and updates for state.
     * @param {String} privateKey The signer private key used to generate a sign for the transaction header.
     */
  constructor (payload, privateKey) {
    // Instance of Secp256k1Context class.
    const secp256k1Context = new Secp256k1Context()
    // Convert the provided private key in bytes.
    const privateKeyBytes = Secp256k1PrivateKey.fromHex(privateKey)

    this._privateKey = privateKey
    this._publicKey = secp256k1Context.getPublicKey(privateKeyBytes).asHex()
    // Nonce generator.
    this.contextId = (Math.random() * 10 ** 18).toString(36)
    this.payload = SCPayload.encode(payload).finish()

    // Transaction header.
    this.header = TransactionHeader.create({
      signerPublicKey: this._publicKey,
      batcherPublicKey: this._publicKey,
      familyName: FAMILY_NAME,
      familyVersion: VERSION,
      nonce: this.contextId,
      inputs: [NAMESPACE],
      outputs: [NAMESPACE],
      payloadSha512: createHash('sha512')
        .update(this.payload)
        .digest('hex'),
    })

    const encodedHeader = TransactionHeader.encode(this.header).finish()
    this.signature = secp256k1Context.sign(encodedHeader, privateKeyBytes)
  }
}

module.exports = Txn
