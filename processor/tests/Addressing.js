'use strict';

const {expect} = require('chai');
const {randomBytes} = require('crypto');
const {
    getSHA512
} = require('../services/utils');
const {
    NAMESPACE,
    PREFIXES,
    USER_PREFIXES,
    TYPE_PREFIXES,
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getCertificationAuthorityAddress,
    getTaskTypeAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress,
    getCompanyAddress,
    getFieldAddress,
    getBatchAddress,
    isValidAddress
} = require('../services/addressing');

describe('Addressing Service', function () {
    let address = null;
    let data = null;
    let dataHash = null;

    describe('System Admin Address', function () {

        before(function () {
            address = getSystemAdminAddress();
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid System Admin address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.SYSTEM_ADMIN +
                '0'.repeat(60)
            )
        })
    });

    describe('Company Admin Address', function () {
        before(function () {
            data = randomBytes(32).toString('hex');
            address = getCompanyAdminAddress(data);
            dataHash = getSHA512(data, 60)
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Company Admin address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.COMPANY_ADMIN +
                dataHash
            )
        })
    });

    describe('Operator Address', function () {
        before(function () {
            data = randomBytes(32).toString('hex');
            address = getOperatorAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Operator address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.OPERATOR +
                dataHash
            )
        })
    });

    describe('Certification Authority Address', function () {
        before(function () {
            data = randomBytes(32).toString('hex');
            address = getCertificationAuthorityAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Operator address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.CERTIFICATION_AUTHORITY +
                dataHash
            )
        })
    });

    describe('Task Type Address', function () {
        before(function () {
            data = "mock-taskType-id";
            address = getTaskTypeAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Task Type address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.TASK_TYPE +
                dataHash
            )
        })
    });

    describe('Product Type Address', function () {
        before(function () {
            data = "mock-productType-id";
            address = getProductTypeAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Product Type address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.PRODUCT_TYPE +
                dataHash
            )
        })
    });

    describe('Event Parameter Type Address', function () {
        before(function () {
            data = "mock-eventParameterType-id";
            address = getEventParameterTypeAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Event Parameter Type address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.EVENT_PARAMETER_TYPE +
                dataHash
            )
        })
    });

    describe('Event Type Address', function () {
        before(function () {
            data = "mock-eventType-id";
            address = getEventTypeAddress(data);
            dataHash = getSHA512(data, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Event Type address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.EVENT_TYPE +
                dataHash
            )
        })
    });

    describe('Company Address', function () {
        before(function () {
            data = "mock-company-id";
            address = getCompanyAddress(data);
            dataHash = getSHA512(data, 62);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Company address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.COMPANY +
                dataHash
            )
        })
    });

    describe('Field Address', function () {
        let company = null;

        before(function () {
            data = "mock-field-id";
            company = "mock-company-id";
            address = getFieldAddress(data, company);
            dataHash = getSHA512(data, 42) + getSHA512(company, 20);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Field address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.FIELD +
                dataHash
            )
        })
    });

    describe('Batch Address', function () {
        let company = null;

        before(function () {
            data = "mock-batch-id";
            company = "mock-company-id";
            address = getBatchAddress(data, company);
            dataHash = getSHA512(data, 42) + getSHA512(company, 20);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString;
            expect(isValidAddress(address)).to.be.true;
        });

        it('Should return a valid Batch address', function () {
            expect(address).to.equal(
                NAMESPACE +
                PREFIXES.BATCH +
                dataHash
            )
        })
    });

});
