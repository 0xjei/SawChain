'use strict';

const {expect} = require('chai');
const {createHash, randomBytes} = require('crypto');

const addressing = require('../services/addressing');

/*** Utilities ***/
// Returns a hex-string SHA-512 hash sliced to a particular length
const hash = (str, length) => {
    return createHash('sha512')
        .update(str)
        .digest('hex')
        .slice(0, length)
};

/*** Tests ***/
describe('Services Functionalities', () => {
    describe('Addressing', () => {
        describe('getSystemAdminAddress', () => {

            it('Should return a hexadecimal string', () => {
                const address = addressing.getSystemAdminAddress();
                expect(address).to.be.a.hexString
            });

            it('Should return a valid System Admin address', function () {
                const address = addressing.getSystemAdminAddress();
                expect(address).to.equal(
                    addressing.NAMESPACE +
                    addressing.PREFIXES.USERS +
                    addressing.USER_PREFIXES.SYSTEM_ADMIN +
                    '0'.repeat(60)
                )
            })
        });
        describe('getCompanyAdminAddress', () => {
            let publicKey = null;

            beforeEach(() => {
                publicKey = randomBytes(32).toString('hex')
            });

            it('Should return a hexadecimal string', () => {
                const address = addressing.getCompanyAdminAddress(publicKey);
                expect(address).to.be.a.hexString
            });

            it('Should return a valid Company Admin address', function () {
                const address = addressing.getCompanyAdminAddress(publicKey);
                const keyHash = hash(publicKey).slice(0, 60);
                expect(address).to.equal(
                    addressing.NAMESPACE +
                    addressing.PREFIXES.USERS +
                    addressing.USER_PREFIXES.COMPANY_ADMIN +
                    keyHash
                )
            })
        });
        describe('getOperatorAddress', () => {
            let publicKey = null;

            beforeEach(() => {
                publicKey = randomBytes(32).toString('hex')
            });

            it('Should return a hexadecimal string', () => {
                const address = addressing.getOperatorAddress(publicKey);
                expect(address).to.be.a.hexString
            });

            it('Should return a valid Operator address', function () {
                const address = addressing.getOperatorAddress(publicKey);
                const keyHash = hash(publicKey).slice(0, 60);
                expect(address).to.equal(
                    addressing.NAMESPACE +
                    addressing.PREFIXES.USERS +
                    addressing.USER_PREFIXES.OPERATOR +
                    keyHash
                )
            })
        })
    })
});
