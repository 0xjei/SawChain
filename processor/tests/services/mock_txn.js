'use strict';

const {createHash} = require('crypto');
const {TransactionHeader} = require('sawtooth-sdk/protobuf');
const {NAMESPACE, FAMILY_NAME, VERSION} = require('../../services/addressing');
const {ACPayload} = require('../../services/proto');
const secp256k1 = require('sawtooth-sdk/signing/secp256k1');

// Init secp256k1 context.
const context = new secp256k1.Secp256k1Context();
// Will be used as contextId and nonce for txn.
const getRandomString = () => (Math.random() * 10 ** 18).toString(36);

// A mock Transaction Process Request or "txn".
class Txn {
    constructor(payload, privateKey = null) {
        // Only for testing purposes.
        const privateKeyWrapper = privateKey === null ?
            context.newRandomPrivateKey() :
            secp256k1.Secp256k1PrivateKey.fromHex(privateKey);

        this._privateKey = privateKeyWrapper.asHex();
        this._publicKey = context.getPublicKey(privateKeyWrapper).asHex();
        this.contextId = getRandomString();
        this.payload = ACPayload.encode(payload).finish();

        this.header = TransactionHeader.create({
            signerPublicKey: this._publicKey,
            batcherPublicKey: this._publicKey,
            familyName: FAMILY_NAME,
            familyVersion: VERSION,
            nonce: getRandomString(),
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
