
const fs = require('fs')
const path = require('path')
const protobuf = require('protobufjs')

// A new empty protobuf root instance.
let root = new protobuf.Root()

// Retrieve every protobuf file.
const files = fs
  .readdirSync(path.resolve(__dirname, '../protos'))
  .map(f => path.resolve(__dirname, '../protos', f))
  .filter(f => f.endsWith('.proto'))

// Load synchronously each protobuf file.
root = root.loadSync(files)

// Payload lookup.
const SCPayload = root.lookup('SCPayload')
const SCPayloadActions = root.lookup('Action').values
const SCPayloadFields = root.lookup('Action').parent.fields

// Users lookup.
const SystemAdmin = root.lookup('SystemAdmin')
const CompanyAdmin = root.lookup('CompanyAdmin')
const Operator = root.lookup('Operator')
const CertificationAuthority = root.lookup('CertificationAuthority')

// Types lookup.
const TaskType = root.lookup('TaskType')
const ProductType = root.lookup('ProductType')
const EventParameterType = root.lookup('EventParameterType')
const EventType = root.lookup('EventType')
const PropertyType = root.lookup('PropertyType')

// Entities lookup.
const Company = root.lookup('Company')
const Field = root.lookup('Field')
const Event = root.lookup('Event')
const Batch = root.lookup('Batch')

// Other messages lookup.
const Shared = root.lookup('Shared')
const Proposal = root.lookup('Proposal')
const Certificate = root.lookup('Certificate')

// Actions lookup.
const UpdateSystemAdminAction = root.lookup('UpdateSystemAdminAction')
const CreateTaskTypeAction = root.lookup('CreateTaskTypeAction')
const CreateProductTypeAction = root.lookup('CreateProductTypeAction')
const CreateEventParameterTypeAction = root.lookup('CreateEventParameterTypeAction')
const CreateEventTypeAction = root.lookup('CreateEventTypeAction')
const CreatePropertyTypeAction = root.lookup('CreatePropertyTypeAction')
const CreateCertificationAuthorityAction = root.lookup('CreateCertificationAuthorityAction')
const CreateCompanyAction = root.lookup('CreateCompanyAction')
const CreateFieldAction = root.lookup('CreateFieldAction')
const CreateOperatorAction = root.lookup('CreateOperatorAction')
const CreateDescriptionEventAction = root.lookup('CreateDescriptionEventAction')
const CreateTransformationEventAction = root.lookup('CreateTransformationEventAction')
const AddBatchCertificateAction = root.lookup('AddBatchCertificateAction')
const RecordBatchPropertyAction = root.lookup('RecordBatchPropertyAction')
const CreateProposalAction = root.lookup('CreateProposalAction')
const AnswerProposalAction = root.lookup('AnswerProposalAction')
const FinalizeBatchAction = root.lookup('FinalizeBatchAction')

module.exports = {
  root,
  SCPayload,
  SCPayloadActions,
  SCPayloadFields,
  SystemAdmin,
  CompanyAdmin,
  Operator,
  CertificationAuthority,
  TaskType,
  ProductType,
  EventParameterType,
  EventType,
  PropertyType,
  Company,
  Field,
  Event,
  Batch,
  Proposal,
  Certificate,
  Shared,
  UpdateSystemAdminAction,
  CreateTaskTypeAction,
  CreateProductTypeAction,
  CreateEventParameterTypeAction,
  CreateEventTypeAction,
  CreatePropertyTypeAction,
  CreateCertificationAuthorityAction,
  CreateCompanyAction,
  CreateFieldAction,
  CreateOperatorAction,
  CreateDescriptionEventAction,
  CreateTransformationEventAction,
  AddBatchCertificateAction,
  RecordBatchPropertyAction,
  CreateProposalAction,
  AnswerProposalAction,
  FinalizeBatchAction,
}
