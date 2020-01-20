'use_strict';

const {expect} = require('chai');
const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const AgriChainHandler = require('./services/handler_wrapper');
const {ACPayload, CreateTaskTypeAction, CreateProductTypeAction, TaskType, ProductType} = require('../services/proto');
const {getTaskTypeAddress, getProductTypeAddress} = require('../services/addressing');

describe('Types Creation', () => {
    const handler = new AgriChainHandler();
    const context = new Context();

    let adminPublicKey = null;
    let adminPrivateKey = null;

    describe('Task Type', () => {
        let id = "mock-id";
        let role = "mock-role";

        const taskTypeAddress = getTaskTypeAddress(id);

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
            const invalidTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_TASK_TYPE})
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no timestamp is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_TASK_TYPE,
                    createTaskType: CreateTaskTypeAction.create({})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no id is given', async () => {
            const invalidTxn = new Txn(
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
            const invalidTxn = new Txn(
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
            const invalidTxn = new Txn(
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
            const taskTypeTxn = new Txn(
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
            const invalidTxn = new Txn(
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

    describe('Product Type', () => {
        const productId = "mock-product-id";
        const productName = "mock-product-name";
        const productDescription = "mock-product-description";
        const productUnitOfMeasure = ProductType.UnitOfMeasure.KILOS;

        const productTypeAddress = getProductTypeAddress(productId);

        it('Should reject if no action payload is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({action: ACPayload.Action.CREATE_PRODUCT_TYPE})
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no timestamp is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    createProductType: CreateProductTypeAction.create({})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no id is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({})
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no name is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId
                    })
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no description is given', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId,
                        name: productName
                    })
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if unit of measure is not present into enumeration of possible values.', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId,
                        name: productName,
                        description: productDescription,
                        measure: 100
                    })
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if signer is not the System Admin', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId,
                        name: productName,
                        description: productDescription,
                        measure: productUnitOfMeasure
                    })
                })
            );
            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should create the Product Type', async () => {
            const productTypeTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId,
                        name: productName,
                        description: productDescription,
                        measure: productUnitOfMeasure
                    })
                }),
                adminPrivateKey
            );

            await handler.apply(productTypeTxn, context);

            expect(context._state[productTypeAddress]).to.not.be.null;
            expect(ProductType.decode(context._state[productTypeAddress]).id).to.equal(productId);
            expect(ProductType.decode(context._state[productTypeAddress]).name).to.equal(productName);
            expect(ProductType.decode(context._state[productTypeAddress]).description).to.equal(productDescription);
            expect(ProductType.decode(context._state[productTypeAddress]).measure).to.equal(productUnitOfMeasure);
            expect(ProductType.decode(context._state[productTypeAddress]).derivedProductsType).to.be.empty;
        });

        it('Should reject if id is already used for another ProductType', async () => {
            const invalidTxn = new Txn(
                ACPayload.create({
                    action: ACPayload.Action.CREATE_PRODUCT_TYPE,
                    timestamp: Date.now(),
                    createProductType: CreateProductTypeAction.create({
                        id: productId,
                        name: productName,
                        description: productDescription,
                        measure: productUnitOfMeasure
                    })
                }),
                adminPrivateKey
            );

            const submission = handler.apply(invalidTxn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });
    });

});

// console.log(await submission);