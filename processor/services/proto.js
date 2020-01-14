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

// Entities
const SystemAdmin = root.lookup('SystemAdmin');
const TaskType = root.lookup('TaskType');

// Actions
const UpdateSystemAdminAction = root.lookup('UpdateSystemAdminAction');
const CreateTaskTypeAction = root.lookup('CreateTaskTypeAction');

module.exports = {
    root,
    ACPayload,
    SystemAdmin,
    TaskType,
    UpdateSystemAdminAction,
    CreateTaskTypeAction
};
