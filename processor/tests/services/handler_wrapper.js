'use strict';

const AgriChainHandler = require('../../handler');

// A wrapper class to make testing AgriChain's easier
class AgriChainWrapper {
  constructor() {
    this.handler = new AgriChainHandler();
  }

  // This method may throw an error, or return a rejected Promise
  // It will be easier to test if we can guarantee it always returns a Promise
  apply(txn, context) {
    try {
      return this.handler.apply(txn, context);
    } catch (err) {
      return new Promise((_, reject) => reject(err));
    }
  }
}

module.exports = AgriChainWrapper;
