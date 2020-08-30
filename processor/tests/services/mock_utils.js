
const secp256k1 = require('sawtooth-sdk/signing/secp256k1')
// A new Secp256k1Context object instance.
const context = new secp256k1.Secp256k1Context()

/**
 * Return an object which contains a new pair of keys.
 * This function is useful to simulate the key-pair external creation for testing purposes.
 */
const createNewKeyPair = () => {
  // Generate a new private key.
  let privateKey = context.newRandomPrivateKey()

  // Get the public key from the private key
  let publicKey = context.getPublicKey(privateKey)

  // Convert keys to hexadecimal strings.
  privateKey = privateKey.asHex()
  publicKey = publicKey.asHex()

  return { privateKey, publicKey }
}

module.exports = {
  createNewKeyPair,
}
