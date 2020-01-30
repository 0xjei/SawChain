'use strict';

const {TransactionHandler} = require('sawtooth-sdk/processor/handler');
const {TpProcessRequest} = require('sawtooth-sdk/protobuf');
const {ACPayload, ACPayloadActions, ACPayloadFields} = require('./services/proto');
const {FAMILY_NAME, NAMESPACE, VERSION} = require('./services/addressing');
const {
    createSystemAdmin,
    updateSystemAdmin
} = require('./actions/systemAdmin');
const {
    createTaskType,
    createProductType,
    createEventParameterType,
    createEventType
} = require('./actions/typeEntities');
const {reject, getPayloadActionField} = require('./services/utils');

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
        super(FAMILY_NAME, [VERSION], [NAMESPACE])
    }

    /**
     * Smart contract logic core. It'll be called once for every transaction.
     * Validate each action logic and update state according to it.
     * @param {TpProcessRequest} txn Transaction process request.
     * @param {Context} context Current state context.
     */
    async apply(txn, context) {
        const payload = ACPayload.decode(txn.payload);

        // Get action.
        const action = payload.action;
        const signerPublicKey = txn.header.signerPublicKey;

        // Action handling.
        switch (action) {
            case ACPayloadActions.CREATE_SYSADMIN:
                await createSystemAdmin(context, signerPublicKey, payload.timestamp);
                break;
            case ACPayloadActions.UPDATE_SYSADMIN:
                await updateSystemAdmin(
                    context,
                    signerPublicKey,
                    payload.timestamp,
                    getPayloadActionField(payload, ACPayloadFields.updateSysAdmin.name)
                );
                break;
            case ACPayloadActions.CREATE_TASK_TYPE:
                await createTaskType(
                    context,
                    signerPublicKey,
                    payload.timestamp,
                    getPayloadActionField(payload, ACPayloadFields.createTaskType.name)
                );
                break;
            case ACPayloadActions.CREATE_PRODUCT_TYPE:
                await createProductType(
                    context,
                    signerPublicKey,
                    payload.timestamp,
                    getPayloadActionField(payload, ACPayloadFields.createProductType.name)
                );
                break;
            case ACPayloadActions.CREATE_EVENT_PARAMETER_TYPE:
                await createEventParameterType(
                    context,
                    signerPublicKey,
                    payload.timestamp,
                    getPayloadActionField(payload, ACPayloadFields.createEventParameterType.name)
                );
                break;
            case ACPayloadActions.CREATE_EVENT_TYPE:
                await createEventType(
                    context,
                    signerPublicKey,
                    payload.timestamp,
                    getPayloadActionField(payload, ACPayloadFields.createEventType.name)
                );
                break;
            default:
                reject(`Unknown action ${action}`);
        }
    }
}

module.exports = AgriChainHandler;
