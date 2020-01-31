'use strict';

const {expect} = require('chai');
const {randomBytes} = require('crypto');
const {getSliceOfStrHash} = require('../services/utils');
const {
    NAMESPACE,
    PREFIXES,
    USER_PREFIXES,
    TYPE_PREFIXES,
    getSystemAdminAddress,
    getCompanyAdminAddress,
    getOperatorAddress,
    getTaskTypeAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress,
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
            dataHash = getSliceOfStrHash(data, 0, 60);
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
            dataHash = getSliceOfStrHash(data, 0, 60);
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

    describe('Task Type Address', function () {
        before(function () {
            data = "mock-taskType-id";
            address = getTaskTypeAddress(data);
            dataHash = getSliceOfStrHash(data, 0, 60);
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
            dataHash = getSliceOfStrHash(data, 0, 60);
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
            dataHash = getSliceOfStrHash(data, 0, 60);
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
            dataHash = getSliceOfStrHash(data, 0, 60);
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

});
