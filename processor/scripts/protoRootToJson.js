'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protobufjs')
const jsonTarget = require('protobufjs/cli/targets/json')

// Empty Protobuf root instance.
let root = new protobuf.Root()

// Retrieve all protobufs files.
let files = fs
  .readdirSync(path.resolve(__dirname, '../../protos'))
  .map(f => path.resolve(__dirname, '../../protos', f))
  .filter(f => f.endsWith('.proto'))

try {
  // Synchronously load multiple protobuf files.
  root = root.loadSync(files)
} catch (error) {
  throw error
}

jsonTarget(root, {}, (error, output) => {
  if (error) {
    throw error
  }

  // Write root into output standard.
  if (output !== '') {
    process.stdout.write(output, 'utf8')
  }
})
