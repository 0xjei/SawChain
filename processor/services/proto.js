'use strict';
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

// Empty Protobuf root instance.
let root = new protobuf.Root();

// Retrieve all protobufs files.
let files = fs
    .readdirSync(path.resolve(__dirname, '../../protos'))
    .map(f => path.resolve(__dirname, '../../protos', f))
    .filter(f => f.endsWith('.proto'));

try {
    // Synchronously load multiple protobuf files.
    root = root.loadSync(files)
} catch (error) {
    throw error
}

const ACPayload = root.lookup('ACPayload');
const SystemAdmin = root.lookup('SystemAdmin');
const UpdateSystemAdminAction = root.lookup('UpdateSystemAdminAction');

module.exports = {
    root,
    ACPayload,
    SystemAdmin,
    UpdateSystemAdminAction
};
