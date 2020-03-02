'use strict';

const {TransactionHandler} = require('sawtooth-sdk/processor/handler');
const {TpProcessRequest} = require('sawtooth-sdk/protobuf');
const {FAMILY_NAME, NAMESPACE, VERSION} = require('./services/addressing');
const {
    SCPayload,
    SCPayloadActions,
    SCPayloadFields
} = require('./services/proto');
const {
    reject,
    getActionFieldFromPayload
} = require('./services/utils');
const {
    createSystemAdmin,
    updateSystemAdmin,
    createOperator,
    createCertificationAuthority
} = require('./actions/users');
const {
    createTaskType,
    createProductType,
    createEventParameterType,
    createEventType,
    createPropertyType
} = require('./actions/typeEntities');
const {
    createCompany,
    createField,
    createDescriptionEvent,
    createTransformationEvent,
    addBatchCertificate
} = require('./actions/entities');

/**
 * Extension of TransactionHandler class to implement the SawChain Transaction Processor logic.
 */
class SawChainHandler extends TransactionHandler {
    /**
     * TransactionHandler constructor registers itself with the
     * validator, declaring which family name, versions, and
     * namespaces it expects to handle.
     */
    constructor() {
        super(FAMILY_NAME, [VERSION], [NAMESPACE])
    }

    /**
     * Evaluate and execute every transaction, updating the state according to the action.
     * @param {TpProcessRequest} txn Transaction process request.
     * @param {Context} context Current state context.
     */
    async apply(txn, context) {
        // Retrieve SawChain Payload from transaction.
        const payload = SCPayload.decode(txn.payload);
        const action = payload.action;
        const signerPublicKey = txn.header.signerPublicKey;
        const timestamp = payload.timestamp;

        // General Transaction Validation: Timestamp is not set.
        if (!timestamp.low && !timestamp.high)
            reject(`Timestamp is not set!`);

        // Handling actions.
        switch (action) {
            case SCPayloadActions.CREATE_SYSADMIN:
                await createSystemAdmin(context, signerPublicKey, timestamp);
                break;

            case SCPayloadActions.UPDATE_SYSADMIN:
                await updateSystemAdmin(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.updateSysAdmin.name)
                );
                break;

            case SCPayloadActions.CREATE_TASK_TYPE:
                await createTaskType(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createTaskType.name)
                );
                break;

            case SCPayloadActions.CREATE_PRODUCT_TYPE:
                await createProductType(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createProductType.name)
                );
                break;

            case SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE:
                await createEventParameterType(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createEventParameterType.name)
                );
                break;

            case SCPayloadActions.CREATE_EVENT_TYPE:
                await createEventType(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createEventType.name)
                );
                break;

            case SCPayloadActions.CREATE_PROPERTY_TYPE:
                await createPropertyType(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createPropertyType.name)
                );
                break;

            case SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY:
                await createCertificationAuthority(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createCertificationAuthority.name)
                );
                break;

            case SCPayloadActions.CREATE_COMPANY:
                await createCompany(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createCompany.name)
                );
                break;

            case SCPayloadActions.CREATE_FIELD:
                await createField(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createField.name)
                );
                break;

            case SCPayloadActions.CREATE_OPERATOR:
                await createOperator(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createOperator.name)
                );
                break;

            case SCPayloadActions.CREATE_DESCRIPTION_EVENT:
                await createDescriptionEvent(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createDescriptionEvent.name)
                );
                break;

            case SCPayloadActions.CREATE_TRANSFORMATION_EVENT:
                await createTransformationEvent(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.createTransformationEvent.name)
                );
                break;

            case SCPayloadActions.ADD_BATCH_CERTIFICATE:
                await addBatchCertificate(
                    context,
                    signerPublicKey,
                    timestamp,
                    getActionFieldFromPayload(payload, SCPayloadFields.addBatchCertificate.name)
                );
                break;

            default:
                reject(`Unknown action: ${action}`);
        }
    }
}

module.exports = SawChainHandler;
