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
    // Load synchronously multiple protobuf files.
    root = root.loadSync(files)
} catch (error) {
    throw error
}

// Payload lookup.
const ACPayload = root.lookup('ACPayload');
const ACPayloadActions = ACPayload.Action;
const ACPayloadFields = ACPayload.fields;

// Entities lookup.
const SystemAdmin = root.lookup('SystemAdmin');

// Types lookup.
const TaskType = root.lookup('TaskType');
const ProductType = root.lookup('ProductType');
const EventParameterType = root.lookup('EventParameterType');
const EventType = root.lookup('EventType');

// Actions lookup.
const UpdateSystemAdminAction = root.lookup('UpdateSystemAdminAction');
const CreateTaskTypeAction = root.lookup('CreateTaskTypeAction');
const CreateProductTypeAction = root.lookup('CreateProductTypeAction');
const CreateEventParameterType = root.lookup('CreateEventParameterType');
const CreateEventType = root.lookup('CreateEventType');

module.exports = {
    root,
    ACPayload,
    ACPayloadActions,
    ACPayloadFields,
    SystemAdmin,
    TaskType,
    ProductType,
    EventParameterType,
    EventType,
    UpdateSystemAdminAction,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterType,
    CreateEventType
};
