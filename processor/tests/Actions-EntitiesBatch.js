'use_strict';

const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');
const {expect} = require('chai');
const Txn = require('./services/mock_txn');
const Context = require('./services/mock_context');
const SawChainHandler = require('./services/handler_wrapper');
const {
    mockCreateSystemAdmin,
    mockCreateOperator,
    mockCreateField,
    mockCreateCompany,
    mockCreateTransformationEvent,
    mockCreateCertificationAuthority,
    populateStateWithMockData
} = require('./services/mock_entities');
const {
    SCPayload,
    SCPayloadActions,
    Company,
    Field,
    Event,
    Batch,
    Location,
    AddCertificateToBatchAction
} = require('../services/proto');
const {
    getOperatorAddress,
    getCertificationAuthorityAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress
} = require('../services/addressing');
const {
    getSHA512,
    getNewKeyPair
} = require('../services/utils');

describe('Batch Actions', function () {
    let handler = null;
    let context = null;
    let txn = null;
    let state = null;

    let sysAdminKeyPair = null;
    let cmpAdminKeyPair = null;
    let optKeyPair = null;

    let companyId = null;

    let fieldAddress = null;
    let batchAddress = null;
    let companyAddress = null;
    let operatorAddress = null;

    // Field Data.
    const fieldId = "field1";
    const fieldProduct = "prd3";
    const productQuantity = 150000;
    const location = Location.create({
        latitude: 39.23054,
        longitude: 9.11917
    });

    const batchId = "batch1";

    before(async function () {
        handler = new SawChainHandler();
        context = new Context();

        // Record the System Admin and get key pair.
        sysAdminKeyPair = await mockCreateSystemAdmin(context, handler);

        // Populate the state with mock types.
        await populateStateWithMockData(context, handler, sysAdminKeyPair.privateKey);

        // Company Admin key pair.
        cmpAdminKeyPair = getNewKeyPair();
        companyId = getSHA512(cmpAdminKeyPair.publicKey, 10);

        // Company address.
        companyAddress = getCompanyAddress(getSHA512(cmpAdminKeyPair.publicKey, 10));

        // Create Company.
        await mockCreateCompany(context, handler, sysAdminKeyPair.privateKey, "company1", "desc1", "web1", cmpAdminKeyPair.publicKey);

        // Create Operator.
        optKeyPair = getNewKeyPair();
        operatorAddress = getOperatorAddress(optKeyPair.publicKey);
        await mockCreateOperator(context, handler, cmpAdminKeyPair.privateKey, optKeyPair.publicKey, "task1");

        // Create Field.
        fieldAddress = getFieldAddress(fieldId, companyId);
        await mockCreateField(context, handler, cmpAdminKeyPair.privateKey, fieldId, "desc1", fieldProduct, productQuantity, location);

        // Create Batch.
        batchAddress = getBatchAddress(batchId, companyId);
        await mockCreateTransformationEvent(context, handler, optKeyPair.privateKey, "event7", [], [fieldId], [100], "prd2", batchId);
    });

    describe('Add Certificate To Batch Action', function () {
        const link = "link1";
        const hash = getSHA512("CertificationDocument");

        let caKeyPair = null;
        let ca2KeyPair = null;

        let caAddress = null;
        let ca2Address = null;

        before(async function () {
            // Create two Certification Authorities.
            caKeyPair = getNewKeyPair();
            caAddress = getCertificationAuthorityAddress(caKeyPair.publicKey);
            await mockCreateCertificationAuthority(context, handler, sysAdminKeyPair.privateKey, caKeyPair.publicKey, "ca1", "web1", ["prd2"]);

            ca2KeyPair = getNewKeyPair();
            ca2Address = getCertificationAuthorityAddress(ca2KeyPair.publicKey);
            await mockCreateCertificationAuthority(context, handler, sysAdminKeyPair.privateKey, ca2KeyPair.publicKey, "ca2", "web2", ["prd1"]);
        });
        it('Should reject if no timestamp is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction);
        });

        it('Should reject if no action data field is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now()
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no batch is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({})
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no company is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no link is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if no hash is given', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided hash is not a valid SHA-512 value', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link,
                        hash: hash.slice(0, 127)
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if the signer is not a Certification Authority', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link,
                        hash: hash
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if the signer is not a Certification Authority', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link,
                        hash: hash
                    })
                })
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided value for batch doesn\'t match with a company Batch', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: "no-company",
                        link: link,
                        hash: hash
                    })
                }),
                caKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if provided value for batch doesn\'t match with a company Batch', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: "no-batch",
                        company: companyId,
                        link: link,
                        hash: hash
                    })
                }),
                caKeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should reject if Certification Authority\'s products list doesn\'t contains one the Product Type of the Batch', async function () {
            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: Date.now(),
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link,
                        hash: hash
                    })
                }),
                ca2KeyPair.privateKey
            );

            const submission = handler.apply(txn, context);

            return expect(submission).to.be.rejectedWith(InvalidTransaction)
        });

        it('Should add a Certificate to provided Company Batch', async function () {
            let timestamp = Date.now();

            txn = new Txn(
                SCPayload.create({
                    action: SCPayloadActions.ADD_CERTIFICATE_TO_BATCH,
                    timestamp: timestamp,
                    addCertificateToBatch: AddCertificateToBatchAction.create({
                        batch: batchId,
                        company: companyId,
                        link: link,
                        hash: hash
                    })
                }),
                caKeyPair.privateKey
            );

            await handler.apply(txn, context);

            // Batch.
            state = context._state[batchAddress];

            expect(state).to.not.be.null;
            expect(Batch.decode(state).id).to.equal(batchId);
            expect(Batch.decode(state).certificates.length).to.equal(1);
            expect(Batch.decode(state).certificates[0].authority).to.equal(caKeyPair.publicKey);
            expect(Batch.decode(state).certificates[0].link).to.equal(link);
            expect(Batch.decode(state).certificates[0].hash).to.equal(hash);
            expect(parseInt(Batch.decode(state).certificates[0].timestamp)).to.equal(timestamp);
        });
    });
});