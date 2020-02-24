'use strict';

const {createHash} = require('crypto');
const {TransactionHeader} = require('sawtooth-sdk/protobuf');
const {NAMESPACE, FAMILY_NAME, VERSION} = require('../../services/addressing');
const {SCPayload} = require('../../services/proto');
const secp256k1 = require('sawtooth-sdk/signing/secp256k1');

/**
 * Class to simulate a Transaction on Sawtooth for state I/O. It's used to make TDD development more faster.
 */
class Txn {

    constructor(payload, privateKey = null) {
        // New secp256k1 context initialization.
        const context = new secp256k1.Secp256k1Context();

        // Creates a new key pair if a private key is not provided.
        const privateKeyWrapper = privateKey === null ?
            context.newRandomPrivateKey() :
            secp256k1.Secp256k1PrivateKey.fromHex(privateKey);

        // Sawtooth Transaction wrapper.
        this._privateKey = privateKeyWrapper.asHex();
        this._publicKey = context.getPublicKey(privateKeyWrapper).asHex();
        this.contextId = (Math.random() * 10 ** 18).toString(36);
        this.payload = SCPayload.encode(payload).finish();

        this.header = TransactionHeader.create({
            signerPublicKey: this._publicKey,
            batcherPublicKey: this._publicKey,
            familyName: FAMILY_NAME,
            familyVersion: VERSION,
            nonce: (Math.random() * 10 ** 18).toString(36),
            inputs: [NAMESPACE],
            outputs: [NAMESPACE],
            payloadSha512: createHash('sha512')
                .update(this.payload)
                .digest('hex')
        });
        const encodedHeader = TransactionHeader.encode(this.header).finish();
        this.signature = context.sign(encodedHeader, privateKeyWrapper)
    }
}

module.exports = Txn;
