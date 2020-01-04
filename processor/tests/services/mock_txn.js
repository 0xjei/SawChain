'use strict';

const { createHash } = require('crypto');
const { TransactionHeader } = require('sawtooth-sdk/protobuf');

const secp256k1 = require('sawtooth-sdk/signing/secp256k1');
const context = new secp256k1.Secp256k1Context();

const protobuf = require('protobufjs')
const protoJson = require('../../utils/protoRoot.json')

const FAMILY_NAME = 'AgriChain';
const FAMILY_VERSION = '0.1';
const NAMESPACE = 'f4cb6d';

const getRandomString = () => (Math.random() * 10 ** 18).toString(36);

// Payload message protobuf.
const root = protobuf.Root.fromJSON(protoJson)
const PayloadMessage = root.lookup('ACPayload')

// A mock Transaction Process Request or "txn"
class Txn {
  constructor(payload, privateKey = null) {
    const privateWrapper = privateKey === null
      ? context.newRandomPrivateKey()
      : secp256k1.Secp256k1PrivateKey.fromHex(privateKey);
    this._privateKey = privateWrapper.asHex();
    this._publicKey = context.getPublicKey(privateWrapper).asHex();

    this.contextId = getRandomString();
    this.payload = PayloadMessage.encode(payload).finish();
    this.header = TransactionHeader.create({
      signerPublicKey: this._publicKey,
      batcherPublicKey: this._publicKey,
      familyName: FAMILY_NAME,
      familyVersion: FAMILY_VERSION,
      nonce: getRandomString(),
      inputs: [ NAMESPACE ],
      outputs: [ NAMESPACE ],
      payloadSha512: createHash('sha512').update(this.payload).digest('hex')
    });
    const encodedHeader = TransactionHeader.encode(this.header).finish();
    this.signature = context.sign(encodedHeader, privateWrapper);
  }
}

module.exports = Txn;
