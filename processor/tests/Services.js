'use strict'

const { expect } = require('chai')
const { createHash, randomBytes } = require('crypto')

const addressing = require('../services/addressing')

/*** Utilities ***/
// Returns a hex-string SHA-512 hash sliced to a particular length
const hash = (str, length) => {
  return createHash('sha512')
    .update(str)
    .digest('hex')
    .slice(0, length)
}

/*** Tests ***/
describe('Services Functionalities', () => {
  describe('Addressing', () => {
    describe('getSystemAdminAddress', () => {
      let publicKey = null

      beforeEach(() => {
        publicKey = randomBytes(32).toString('hex')
      })

      it('Should return a hexadecimal string', () => {
        const address = addressing.getSystemAdminAddress(publicKey)
        expect(address).to.be.a.hexString
      })

      it('Should return a valid System Admin address', function () {
        const address = addressing.getSystemAdminAddress(publicKey)
        const keyHash = hash(publicKey).slice(0, 60)
        expect(address).to.equal(
          addressing.NAMESPACE +
            addressing.PREFIXES.USERS +
            addressing.USER_PREFIXES.SYSTEM_ADMIN +
            keyHash
        )
      })
    })
    describe('getCompanyAdminAddress', () => {
      let publicKey = null

      beforeEach(() => {
        publicKey = randomBytes(32).toString('hex')
      })

      it('Should return a hexadecimal string', () => {
        const address = addressing.getCompanyAdminAddress(publicKey)
        expect(address).to.be.a.hexString
      })

      it('Should return a valid Company Admin address', function () {
        const address = addressing.getCompanyAdminAddress(publicKey)
        const keyHash = hash(publicKey).slice(0, 60)
        expect(address).to.equal(
          addressing.NAMESPACE +
            addressing.PREFIXES.USERS +
            addressing.USER_PREFIXES.COMPANY_ADMIN +
            keyHash
        )
      })
    })
    describe('getOperatorAddress', () => {
      let publicKey = null
      let companyOwner = null

      beforeEach(() => {
        publicKey = randomBytes(32).toString('hex')
        companyOwner = randomBytes(32).toString('hex')
      })

      it('Should return a hexadecimal string', () => {
        const address = addressing.getOperatorAddress(companyOwner, publicKey)
        expect(address).to.be.a.hexString
      })

      it('Should return a valid Operator address', function () {
        const address = addressing.getOperatorAddress(companyOwner, publicKey)
        const ownerHash = hash(companyOwner).slice(0, 16)
        const keyHash = hash(publicKey).slice(0, 44)
        expect(address).to.equal(
          addressing.NAMESPACE +
            addressing.PREFIXES.USERS +
            addressing.USER_PREFIXES.OPERATOR +
            ownerHash +
            keyHash
        )
      })
    })
  })
})
