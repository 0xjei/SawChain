'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const AgriChainHandler = require('./services/handler_wrapper');
const {ACPayload, CreateTaskTypeAction, TaskType} = require('../services/proto');
const {getTaskTypeAddress} = require('../services/addressing');

describe('Types Creation', () => {
    describe('Task Type', () => {
        let handler = null;
        let context = null;
        let publicKey = null;
        let privateKey = null;
        let taskTypeAddress = null;
        let id = null;
        let role = null;

        before(async function () {
            handler = new AgriChainHandler();
            context = new Context();

            // Create a System Admin.
            systemAdminTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
            );
            publicKey = systemAdminTxn._publicKey;
            privateKey = systemAdminTxn._privateKey;
            await handler.apply(systemAdminTxn, context);

            // Txn for TaskType.
            id = "FOP";
            role = "Field Operator";
            taskTypeTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: id, role: role})
                }),
                privateKey
            );

            taskTypeAddress = getTaskTypeAddress(id)
        });

        it('Should reject if no timestamp is given', async () => {
            invalidTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_TASK_TYPE})
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no id is given', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no role is given', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: "FOP"})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if signer is not the System Admin', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: id, role: role})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Task Type', async () => {
            await handler.apply(taskTypeTxn, context);

            expect(context._state[taskTypeAddress]).to.exist;
            expect(TaskType.decode(context._state[taskTypeAddress]).id).to.equal(id);
            expect(TaskType.decode(context._state[taskTypeAddress]).role).to.equal(role);
        });

        it('Should reject if id is already used for another TaskType', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: "FOP", role: "Field Operator"})
                }),
                privateKey
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });
});