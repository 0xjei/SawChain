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
        const handler = new AgriChainHandler();
        const context = new Context();

        let adminPublicKey = null;
        let adminPrivateKey = null;
        let id = "mock-id";
        let role = "mock-role";

        let taskTypeAddress = getTaskTypeAddress(id);

        before(async function () {
            // Create a System Admin.
            const systemAdminTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_SYSADMIN, timestamp: Date.now()})
            );
            adminPublicKey = systemAdminTxn._publicKey;
            adminPrivateKey = systemAdminTxn._privateKey;
            await handler.apply(systemAdminTxn, context);
        });

        it('Should reject if no action payload is given', async () => {
            invalidTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_TASK_TYPE})
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no timestamp is given', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
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
                    createTaskType: CreateTaskTypeAction.create({id: id})
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
            taskTypeTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: id, role: role})
                }),
                adminPrivateKey
            );

            await handler.apply(taskTypeTxn, context);

            expect(context._state[taskTypeAddress]).to.not.be.null;
            expect(TaskType.decode(context._state[taskTypeAddress]).id).to.equal(id);
            expect(TaskType.decode(context._state[taskTypeAddress]).role).to.equal(role);
        });

        it('Should reject if id is already used for another TaskType', async () => {
            invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    timestamp: Date.now(),
                    createTaskType: CreateTaskTypeAction.create({id: id, role: role})
                }),
                adminPrivateKey
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });
});