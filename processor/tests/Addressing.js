'use strict';

const {expect} = require('chai');
const {randomBytes} = require('crypto');
const {getSHA512} = require('../services/utils');
const addressing = require('../services/addressing');

/*** Utilities ***/


/*** Tests ***/
describe('Addressing Service', function () {
    let address = null;
    let data = null;
    let dataHash = null;

    describe('System Admin Address', function () {

        before(function () {
            address = addressing.getSystemAdminAddress();
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid System Admin address', function () {
            expect(address).to.equal(
                addressing.NAMESPACE +
                addressing.PREFIXES.USERS +
                addressing.USER_PREFIXES.SYSTEM_ADMIN +
                '0'.repeat(60)
            )
        })
    });

    describe('Company Admin Address', function () {
        before(function () {
            data = randomBytes(32).toString('hex');
            address = addressing.getCompanyAdminAddress(data);
            dataHash = getSHA512(data).slice(0, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Company Admin address', function () {
            expect(address).to.equal(
                addressing.NAMESPACE +
                addressing.PREFIXES.USERS +
                addressing.USER_PREFIXES.COMPANY_ADMIN +
                dataHash
            )
        })
    });

    describe('Operator Address', function () {
        before(function () {
            data = randomBytes(32).toString('hex');
            address = addressing.getOperatorAddress(data);
            dataHash = getSHA512(data).slice(0, 60);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Operator address', function () {
            expect(address).to.equal(
                addressing.NAMESPACE +
                addressing.PREFIXES.USERS +
                addressing.USER_PREFIXES.OPERATOR +
                dataHash
            )
        })
    });

    describe('Task Type Address', function () {
        before(function () {
            data = "mock-taskType-id";
            address = addressing.getTaskTypeAddress(data);
            dataHash = getSHA512(data).slice(0, 62);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Task Type address', function () {
            expect(address).to.equal(
                addressing.FULL_PREFIXES.TASK_TYPE +
                dataHash
            )
        })
    });

    describe('Product Type Address', function () {
        before(function () {
            data = "mock-productType-id";
            address = addressing.getProductTypeAddress(data);
            dataHash = getSHA512(data).slice(0, 62);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Task Type address', function () {
            expect(address).to.equal(
                addressing.FULL_PREFIXES.PRODUCT_TYPE +
                dataHash
            )
        })
    });

    describe('Event Parameter Type Address', function () {
        before(function () {
            data = "mock-eventParameterType-id";
            address = addressing.getEventParameterTypeAddress(data);
            dataHash = getSHA512(data).slice(0, 62);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Task Type address', function () {
            expect(address).to.equal(
                addressing.FULL_PREFIXES.EVENT_PARAMETER_TYPE +
                dataHash
            )
        })
    });

    describe('Event Type Address', function () {
        before(function () {
            data = "mock-eventType-id";
            address = addressing.getEventTypeAddress(data);
            dataHash = getSHA512(data).slice(0, 62);
        });

        it('Should return a hexadecimal string', function () {
            expect(address).to.be.a.hexString
        });

        it('Should return a valid Task Type address', function () {
            expect(address).to.equal(
                addressing.FULL_PREFIXES.EVENT_TYPE +
                dataHash
            )
        })
    });

});
