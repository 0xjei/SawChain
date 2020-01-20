const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const secp256k1 = require('sawtooth-sdk/signing/secp256k1');
const secp256k1Context = new secp256k1.Secp256k1Context();

// A quick convenience function to throw an error with a joined message
const reject = (...msgs) => {
    throw new InvalidTransaction(msgs.join(' '))
};

// A method that returns a new private and public key pair.
const getNewKeyPair = () => {
    let privateKey = secp256k1Context.newRandomPrivateKey();
    const publicKey = secp256k1Context.getPublicKey(privateKey).asHex();
    privateKey = privateKey.asHex();

    return {privateKey, publicKey}
};

module.exports = {reject, getNewKeyPair};