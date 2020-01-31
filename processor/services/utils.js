const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {createHash} = require('crypto');

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

// Returns the action payload field.
const getPayloadActionField = (payload, actionFieldName) => {
    if (!payload[actionFieldName])
        reject(`Action payload is missing for ${actionFieldName} action!`);

    return payload[actionFieldName]
};

// Returns a hex-string SHA-512 hash sliced to a particular length
const getSHA512 = (str, length) => {
    return createHash('sha512')
        .update(str)
        .digest('hex')
        .slice(0, length)
};

module.exports = {
    reject,
    getNewKeyPair,
    getPayloadActionField,
    getSHA512
};