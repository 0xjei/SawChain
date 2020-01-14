const {InvalidTransaction} = require('sawtooth-sdk/processor/exceptions');

// A quick convenience function to throw an error with a joined message
const reject = (...msgs) => {
    throw new InvalidTransaction(msgs.join(' '))
};

module.exports = {reject};