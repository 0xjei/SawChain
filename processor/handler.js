'use strict';

const {TransactionHandler} = require('sawtooth-sdk/processor/handler');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {ACPayload} = require('./services/proto');
const {FAMILY_NAME, NAMESPACE} = require('./services/addressing');
const {createSystemAdmin, updateSystemAdmin} = require('./actions/systemAdmin');
const {createTaskType, createProductType} = require('./actions/typeEntities');
const {reject} = require('./services/utils');

/**
 * Extension of TransactionHandler class for the AgriChain Transaction Processor logic.
 */
class AgriChainHandler extends TransactionHandler {
    /**
     * TransactionHandler constructor registers itself with the
     * validator, declaring which family name, versions, and
     * namespaces it expects to handle.
     */
    constructor() {
        super(FAMILY_NAME, ['0.1'], [NAMESPACE])
    }

    /**
     * Smart contract logic core. It'll be called once for every transaction.
     * Validate each action logic and update state according to it.
     * @param {Transaction} txn Transaction process request.
     * @param {Context} context Current state context.
     */
    async apply(txn, context) {
        let payload = null;

        // Payload decoding.
        try {
            payload = ACPayload.decode(txn.payload)
        } catch (error) {
            throw new InvalidTransaction(`Failed to decode the payload ${error}`)
        }

        // Get action.
        const action = payload.action;
        const signerPublicKey = txn.header.signerPublicKey;

        // Action handling.
        switch (action) {
            case ACPayload.Action.CREATE_SYSADMIN:
                await createSystemAdmin(context, signerPublicKey, payload.timestamp);
                break;
            case ACPayload.Action.UPDATE_SYSADMIN:
                if (!payload.updateSysAdmin)
                    reject(`Action payload is missing for update System Admin action!`);
                await updateSystemAdmin(context, signerPublicKey, payload.timestamp, payload.updateSysAdmin);
                break;
            case ACPayload.Action.CREATE_TASK_TYPE:
                if (!payload.createTaskType)
                    reject(`Action payload is missing for create Task Type action!`);
                await createTaskType(context, signerPublicKey, payload.timestamp, payload.createTaskType);
                break;
            case ACPayload.Action.CREATE_PRODUCT_TYPE:
                if (!payload.createProductType)
                    reject(`Action payload is missing for create Product Type action!`);
                await createProductType(context, signerPublicKey, payload.timestamp, payload.createProductType);
                break;
            default:
                throw new InvalidTransaction(`Unknown action ${action}`)
        }
    }
}

module.exports = AgriChainHandler;
