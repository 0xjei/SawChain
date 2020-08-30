
const { expect } = require('chai')
const { randomBytes } = require('crypto')
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
  getPropertyTypeAddress,
  getCompanyAddress,
  getFieldAddress,
  getBatchAddress,
  isValidAddress,
  hashAndSlice,
} = require('../services/addressing')

describe('Addressing Service', function () {
  let address = null
  let data = null
  let dataHash = null

  describe('System Admin', function () {
    before(async function () {
      address = getSystemAdminAddress()
    })

    it('Should return a valid System Admin address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.SYSTEM_ADMIN +
                '0'.repeat(60),
      )
    })
  })

  describe('Company Admin', function () {
    before(async function () {
      data = randomBytes(32).toString('hex')
      address = getCompanyAdminAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Company Admin address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.COMPANY_ADMIN +
                dataHash,
      )
    })
  })

  describe('Operator', function () {
    before(async function () {
      data = randomBytes(32).toString('hex')
      address = getOperatorAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Operator address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.OPERATOR +
                dataHash,
      )
    })
  })

  describe('Certification Authority', function () {
    before(async function () {
      data = randomBytes(32).toString('hex')
      address = getCertificationAuthorityAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Operator address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.USERS +
                USER_PREFIXES.CERTIFICATION_AUTHORITY +
                dataHash,
      )
    })
  })

  describe('Task Type', function () {
    before(async function () {
      data = 'mock-taskType-id'
      address = getTaskTypeAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Task Type address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.TASK_TYPE +
                dataHash,
      )
    })
  })

  describe('Product Type', function () {
    before(async function () {
      data = 'mock-productType-id'
      address = getProductTypeAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Product Type address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.PRODUCT_TYPE +
                dataHash,
      )
    })
  })

  describe('Event Parameter Type', function () {
    before(async function () {
      data = 'mock-eventParameterType-id'
      address = getEventParameterTypeAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Event Parameter Type address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.EVENT_PARAMETER_TYPE +
                dataHash,
      )
    })
  })

  describe('Event Type', function () {
    before(async function () {
      data = 'mock-eventType-id'
      address = getEventTypeAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Event Type address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.EVENT_TYPE +
                dataHash,
      )
    })
  })

  describe('Property Type', function () {
    before(async function () {
      data = 'mock-propertyType-id'
      address = getPropertyTypeAddress(data)
      dataHash = hashAndSlice(data, 60)
    })

    it('Should return a valid Event Type address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.TYPES +
                TYPE_PREFIXES.PROPERTY_TYPE +
                dataHash,
      )
    })
  })

  describe('Company', function () {
    before(async function () {
      data = 'mock-company-id'
      address = getCompanyAddress(data)
      dataHash = hashAndSlice(data, 62)
    })

    it('Should return a valid Company address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.COMPANY +
                dataHash,
      )
    })
  })

  describe('Field', function () {
    let company = null

    before(async function () {
      data = 'mock-field-id'
      company = 'mock-company-id'
      address = getFieldAddress(data, company)
      dataHash = hashAndSlice(data, 42) + hashAndSlice(company, 20)
    })

    it('Should return a valid Field address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.FIELD +
                dataHash,
      )
    })
  })

  describe('Batch', function () {
    before(async function () {
      data = 'mock-batch-id'
      address = getBatchAddress(data)
      dataHash = hashAndSlice(data, 62)
    })

    it('Should return a valid Batch address', function () {
      expect(address).to.be.a.hexString
      expect(isValidAddress(address)).to.be.true
      expect(address).to.equal(
        NAMESPACE +
                PREFIXES.BATCH +
                dataHash,
      )
    })
  })
})
