'use strict'

const chai = require('chai')

// Asserts that a string is an hexadecimal string.
// Useful for addressing purposes.
chai.Assertion.addProperty('hexString', function () {
  this.assert(
    typeof this._obj === 'string' && /^[0-9a-f]*$/.test(this._obj),
    'expected #{this} to be a hexadecimal string',
    'expected #{this} to not be a hexadecimal string'
  )
})

// Asserts that a promise has been rejected with a particular error type.
// Useful for Sawtooth InvalidTransaction error.
chai.Assertion.addMethod('rejectedWith', function (errorClass) {
  let errorInstance = null

  return this._obj
    .catch(err => {
      chai.expect(err).to.be.instanceOf(errorClass)
      errorInstance = err
      return true
    })
    .then(wasRejected => {
      this.assert(
        wasRejected === true,
        'expected Promise to be rejected',
        'expected Promise to not be rejected'
      )
      return errorInstance
    })
})
