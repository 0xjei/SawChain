'use strict';

const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

// A new empty protobuf root instance.
let root = new protobuf.Root();

// Retrieve protobuf files.
let files = fs
    .readdirSync(path.resolve(__dirname, '../../protos'))
    .map(f => path.resolve(__dirname, '../../protos', f))
    .filter(f => f.endsWith('.proto'));

try {
    // Load synchronously the retrieved protobuf files.
    root = root.loadSync(files)
} catch (error) {
    throw error
}

// Payload utilities lookup.
const SCPayload = root.lookup('SCPayload');
const SCPayloadActions = SCPayload.Action;
const SCPayloadFields = SCPayload.fields;

// Users lookup.
const SystemAdmin = root.lookup('SystemAdmin');
const CompanyAdmin = root.lookup('CompanyAdmin');
const Operator = root.lookup('Operator');

// Entities lookup.
const Company = root.lookup('Company');
const Field = root.lookup('Field');

// Types lookup.
const TaskType = root.lookup('TaskType');
const ProductType = root.lookup('ProductType');
const EventParameterType = root.lookup('EventParameterType');
const EventType = root.lookup('EventType');

// Actions lookup.
const UpdateSystemAdminAction = root.lookup('UpdateSystemAdminAction');
const CreateTaskTypeAction = root.lookup('CreateTaskTypeAction');
const CreateProductTypeAction = root.lookup('CreateProductTypeAction');
const CreateEventParameterTypeAction = root.lookup('CreateEventParameterTypeAction');
const CreateEventTypeAction = root.lookup('CreateEventTypeAction');
const CreateCompanyAction = root.lookup('CreateCompanyAction');
const CreateFieldAction = root.lookup('CreateFieldAction');
const CreateOperatorAction = root.lookup('CreateOperatorAction');

// Other protobuf messages lookup.
const Location = root.lookup('Location');

module.exports = {
    root,
    SCPayload,
    SCPayloadActions,
    SCPayloadFields,
    SystemAdmin,
    CompanyAdmin,
    Operator,
    TaskType,
    ProductType,
    EventParameterType,
    EventType,
    Company,
    Field,
    UpdateSystemAdminAction,
    CreateTaskTypeAction,
    CreateProductTypeAction,
    CreateEventParameterTypeAction,
    CreateEventTypeAction,
    CreateCompanyAction,
    CreateFieldAction,
    CreateOperatorAction,
    Location
};
