const Txn = require('./mock_txn');
const {
    ACPayload,
    ACPayloadActions
} = require('../../services/proto');

const createSystemAdmin = async (context, handler) => {
    const txn = new Txn(
        ACPayload.create({
            action: ACPayloadActions.CREATE_SYSADMIN,
            timestamp: Date.now()
        })
    );

    await handler.apply(txn, context);

    const privateKey = txn._privateKey;
    const publicKey = txn._publicKey;

    return {privateKey, publicKey};
};

module.exports = {
    createSystemAdmin
};