
const Txn = require('./mock_txn')
const {
  SCPayload,
  SCPayloadActions,
  ProductType,
  EventType,
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
  CreateProposalAction,
  FinalizeBatchAction,
} = require('../../services/proto')
const {
  getTaskTypeAddress,
  getProductTypeAddress,
  getEventParameterTypeAddress,
} = require('../../services/addressing')

/**
 * Create and execute a create System Admin action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} privateKey The System Admin private key.
 */
const mockCreateSystemAdmin = async (context, handler, privateKey) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_SYSTEM_ADMIN,
      timestamp: Date.now(),
    }),
    privateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Task Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Task Type unique identifier.
 * @param {String} task The Task Type name.
 */
const mockCreateTaskType = async (
  context,
  handler,
  systemAdminPrivateKey,
  id,
  task,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_TASK_TYPE,
      timestamp: Date.now(),
      createTaskType: CreateTaskTypeAction.create({
        id: id,
        task: task,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Product Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Product Type unique identifier.
 * @param {String} name The Product name.
 * @param {String} description A short description of the product.
 * @param {Number} measure The unit of measure used for the product quantity.
 * @param {Object[]} derivedProductTypes A list of derived Product Types with a quantity conversion rate.
 */
const mockCreateProductType = async (
  context,
  handler,
  systemAdminPrivateKey,
  id,
  name,
  description,
  measure,
  derivedProductTypes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_PRODUCT_TYPE,
      timestamp: Date.now(),
      createProductType: CreateProductTypeAction.create({
        id: id,
        name: name,
        description: description,
        measure: measure,
        derivedProductTypes: derivedProductTypes,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Event Parameter Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Event Parameter Type unique identifier.
 * @param {String} name The Event Parameter Type name.
 * @param {Number} dataType The data type used for the parameter information.
 */
const mockCreateEventParameterType = async (
  context,
  handler,
  systemAdminPrivateKey,
  id,
  name,
  dataType,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_EVENT_PARAMETER_TYPE,
      timestamp: Date.now(),
      createEventParameterType: CreateEventParameterTypeAction.create({
        id: id,
        name: name,
        dataType: dataType,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Event Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Event Type unique identifier.
 * @param {Number} typology The Event Type typology.
 * @param {String} name The Event Type name.
 * @param {String} description A short description of the event.
 * @param {String[]} enabledTaskTypes A list of enabled Task Types addresses for recording the event.
 * @param {String[]} enabledProductTypes A list of enabled Product Types addresses where recording the event.
 * @param {String[]} parameters A list of Event Parameters with additional features.
 * @param {String[]} enabledDerivedProductTypes A list of enabled derived Product Types addresses for the transformation of the product.
 */
const mockCreateEventType = async (
  context,
  handler,
  systemAdminPrivateKey,
  id,
  typology,
  name,
  description,
  parameters,
  enabledTaskTypes,
  enabledProductTypes,
  enabledDerivedProductTypes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_EVENT_TYPE,
      timestamp: Date.now(),
      createEventType: CreateEventTypeAction.create({
        id: id,
        typology: typology,
        name: name,
        description: description,
        parameters: parameters,
        enabledTaskTypes: enabledTaskTypes,
        enabledProductTypes: enabledProductTypes,
        enabledDerivedProductTypes: enabledDerivedProductTypes,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Property Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Property Type unique identifier.
 * @param {String} name The Property Type name.
 * @param {Number} dataType Property type from enumeration of possible values.
 * @param {String[]} enabledTaskTypes List of identifiers of Task Types which Operators must have to record the Property Type.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the Property Type can be recorded.

 */
const mockCreatePropertyType = async (
  context,
  handler,
  systemAdminPrivateKey,
  id,
  name,
  dataType,
  enabledTaskTypes,
  enabledProductTypes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_PROPERTY_TYPE,
      timestamp: Date.now(),
      createPropertyType: CreatePropertyTypeAction.create({
        id: id,
        name: name,
        dataType: dataType,
        enabledTaskTypes: enabledTaskTypes,
        enabledProductTypes: enabledProductTypes,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Company action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} name The Company name.
 * @param {String} description A short description of the Company.
 * @param {String} website The Company website.
 * @param {String} admin The Company Admin's public key.
 * @param {String[]} enabledProductTypes A list of enabled Product Types addresses used in the Company.
 */
const mockCreateCompany = async (
  context,
  handler,
  systemAdminPrivateKey,
  name,
  description,
  website,
  admin,
  enabledProductTypes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_COMPANY,
      timestamp: Date.now(),
      createCompany: CreateCompanyAction.create({
        name: name,
        description: description,
        website: website,
        admin: admin,
        enabledProductTypes: enabledProductTypes,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Field action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} companyAdminPrivateKey The Company Admin private key.
 * @param {String} id The Field unique identifier.
 * @param {String} description A short description of the Field.
 * @param {String} product The Product Type address of the cultivable product.
 * @param {Number} quantity The predicted maximum production quantity.
 * @param {Object} location The Field approximate location coordinates.
 */
const mockCreateField = async (
  context,
  handler,
  companyAdminPrivateKey,
  id,
  description,
  product,
  quantity,
  location,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_FIELD,
      timestamp: Date.now(),
      createField: CreateFieldAction.create({
        id: id,
        description: description,
        product: product,
        quantity: quantity,
        location: location,
      }),
    }),
    companyAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Operator action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} companyAdminPrivateKey The Company Admin private key.
 * @param {String} publicKey The Operator public key.
 * @param {String} task Task Type identifier for Operator task.
 */
const mockCreateOperator = async (
  context,
  handler,
  companyAdminPrivateKey,
  publicKey,
  task,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_OPERATOR,
      timestamp: Date.now(),
      createOperator: CreateOperatorAction.create({
        publicKey: publicKey,
        task: task,
      }),
    }),
    companyAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Certification Authority action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} publicKey The Certification Authority public key.
 * @param {String} name The Certification Authority name.
 * @param {String} website The Certification Authority website.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the certificate can be recorded.
 */
const mockCreateCertificationAuthority = async (
  context,
  handler,
  systemAdminPrivateKey,
  publicKey,
  name,
  website,
  enabledProductTypes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_CERTIFICATION_AUTHORITY,
      timestamp: Date.now(),
      createCertificationAuthority: CreateCertificationAuthorityAction.create({
        publicKey: publicKey,
        name: name,
        website: website,
        enabledProductTypes: enabledProductTypes,
      }),
    }),
    systemAdminPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Description Event action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} eventType The Event Type address.
 * @param {String} batch A company Batch address where recording the event.
 * @param {String} field A company Field address where recording the event.
 * @param {Object[]} values A list of values for each Parameter Type.
 *
 */
const mockCreateDescriptionEvent = async (
  context,
  handler,
  operatorPrivateKey,
  eventType,
  batch,
  field,
  values,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_DESCRIPTION_EVENT,
      timestamp: Date.now(),
      createDescriptionEvent: CreateDescriptionEventAction.create({
        eventType: eventType,
        field: field,
        batch: batch,
        values: values,
      }),
    }),
    operatorPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Transformation Event action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} eventType The Event Type address.
 * @param {String[]} batches A list of company Batches addresses to transform.
 * @param {String[]} fields A list of company Fields addresses to transform.
 * @param {Number[]} quantities A list of corresponding quantities for transformation.
 * @param {String} derivedProduct The output Product Type address.
 * @param {String} outputBatchId The output Batch unique identifier.
 */
const mockCreateTransformationEvent = async (
  context,
  handler,
  operatorPrivateKey,
  eventType,
  batches,
  fields,
  quantities,
  derivedProduct,
  outputBatchId,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_TRANSFORMATION_EVENT,
      timestamp: Date.now(),
      createTransformationEvent: CreateTransformationEventAction.create({
        eventType: eventType,
        fields: fields,
        batches: batches,
        quantities: quantities,
        derivedProduct: derivedProduct,
        outputBatchId: outputBatchId,
      }),
    }),
    operatorPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a create Proposal action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} batch The Batch state address.
 * @param {String} receiverCompany The receiver Company state address.
 * @param {String} notes A note for issuing the Proposal.
 */

const mockCreateProposal = async (
  context,
  handler,
  operatorPrivateKey,
  batch,
  receiverCompany,
  notes,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.CREATE_PROPOSAL,
      timestamp: Date.now(),
      createProposal: CreateProposalAction.create({
        batch: batch,
        receiverCompany: receiverCompany,
        notes: notes,
      }),
    }),
    operatorPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Create and execute a Finalize Batch action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} batch The Batch state address.
 * @param {Number} reason The Batch finalization reason.
 * @param {String} explanation A short explanation for the finalization.
 */
const mockFinalizeBatch = async (
  context,
  handler,
  operatorPrivateKey,
  batch,
  reason,
  explanation,
) => {
  const txn = new Txn(
    SCPayload.create({
      action: SCPayloadActions.FINALIZE_BATCH,
      timestamp: Date.now(),
      finalizeBatch: FinalizeBatchAction.create({
        reason: reason,
        batch: batch,
        explanation: explanation,
      }),
    }),
    operatorPrivateKey,
  )

  await handler.apply(txn, context)
}

/**
 * Populate the state object recording a bunch of different combinations of types.
 * This function is made in order to speed up tests by a pre-defined set of types.
 * (nb. The information is for testing purposes only and is not intended for any production use).
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 */
const populateStateWithMockData = async (context, handler, systemAdminPrivateKey) => {
  // Task types.
  await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'TKT1', 'role1')
  await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'TKT2', 'role2')
  await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'TKT3', 'role3')

  // Product Types.
  const derivedProd1 = ProductType.DerivedProductType.create({
    productTypeAddress: getProductTypeAddress('PDT1'),
    conversionRate: 0.8,
  })

  const derivedProd2 = ProductType.DerivedProductType.create({
    productTypeAddress: getProductTypeAddress('PDT2'),
    conversionRate: 0.7,
  })

  await mockCreateProductType(context, handler, systemAdminPrivateKey, 'PDT1', 'name1', 'desc1', 3, []) // Bottles.
  await mockCreateProductType(context, handler, systemAdminPrivateKey, 'PDT2', 'name2', 'desc2', 1, [derivedProd1]) // Olive
  await mockCreateProductType(context, handler, systemAdminPrivateKey, 'PDT3', 'name3', 'desc3', 0, [derivedProd2]) // Olives.
  await mockCreateProductType(context, handler, systemAdminPrivateKey, 'PDT4', 'name4', 'desc4', 0, [derivedProd2]) // Olives.

  // Event Parameter Types.
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT1', 'name1', 0)
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT2', 'name2', 1)
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT3', 'name3', 2)
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT4', 'name4', 0)
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT5', 'name5', 1)
  await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'EPT6', 'name6', 2)

  // Event Types.
  const param1 = EventType.Parameter.create({
    eventParameterTypeAddress: getEventParameterTypeAddress('EPT1'),
    required: true,
    minValue: 10,
    maxValue: 100,
  })
  const param2 = EventType.Parameter.create({
    eventParameterTypeAddress: getEventParameterTypeAddress('EPT2'),
    required: true,
    minLength: 3,
    maxLength: 10,
  })
  const param4 = EventType.Parameter.create({
    eventParameterTypeAddress: getEventParameterTypeAddress('EPT4'),
    required: false,
    minValue: 10,
    maxValue: 100,
  })
  const param5 = EventType.Parameter.create({
    eventParameterTypeAddress: getEventParameterTypeAddress('EPT5'),
    required: false,
    minLength: 1,
    maxLength: 10,
  })
  const param6 = EventType.Parameter.create({
    eventParameterTypeAddress: getEventParameterTypeAddress('EPT6'),
    required: false,
  })

  // Description events.
  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT1',
    EventType.Typology.DESCRIPTION,
    'name1',
    'desc1',
    [
      param1,
      param2,
    ],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT2',
    EventType.Typology.DESCRIPTION,
    'name2',
    'desc2',
    [
      param4,
      param5,
      param6,
    ],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT3',
    EventType.Typology.DESCRIPTION,
    'name3',
    'desc3',
    [
      param1,
      param4,
    ],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT4',
    EventType.Typology.DESCRIPTION,
    'name4',
    'desc4',
    [param4],
    [
      getTaskTypeAddress('TKT2'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT5',
    EventType.Typology.DESCRIPTION,
    'name5',
    'desc5',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT6',
    EventType.Typology.DESCRIPTION,
    'name6',
    'desc6',
    [param1, param4],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
      getProductTypeAddress('PDT2'),
    ],
    [],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT7',
    EventType.Typology.DESCRIPTION,
    'name7',
    'desc7',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
    ],
    [],
  )

  // Transformation events.
  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT8',
    EventType.Typology.TRANSFORMATION,
    'name8',
    'desc8',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT3'),
      getProductTypeAddress('PDT4'),

    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT9',
    EventType.Typology.TRANSFORMATION,
    'name9',
    'desc9',
    [],
    [
      getTaskTypeAddress('TKT2'),
    ],
    [
      getProductTypeAddress('PDT3'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT10',
    EventType.Typology.TRANSFORMATION,
    'name10',
    'desc10',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
    [
      getProductTypeAddress('PDT1'),
    ],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT11',
    EventType.Typology.TRANSFORMATION,
    'name11',
    'desc11',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT4'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreateEventType(context, handler, systemAdminPrivateKey,
    'EVT12',
    EventType.Typology.TRANSFORMATION,
    'name12',
    'desc12',
    [],
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
    [
      getProductTypeAddress('PDT1'),
    ],
  )

  // Property Types.
  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT1',
    'name1',
    0,
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT2',
    'name2',
    1,
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT3',
    'name3',
    2,
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT4',
    'name4',
    3,
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT5',
    'name5',
    0,
    [
      getTaskTypeAddress('TKT2'),
    ],
    [
      getProductTypeAddress('PDT2'),
    ],
  )

  await mockCreatePropertyType(context, handler, systemAdminPrivateKey,
    'PRT6',
    'name6',
    1,
    [
      getTaskTypeAddress('TKT1'),
    ],
    [
      getProductTypeAddress('PDT1'),
    ],
  )
}

module.exports = {
  mockCreateSystemAdmin,
  mockCreateTaskType,
  mockCreateProductType,
  mockCreateEventParameterType,
  mockCreateEventType,
  mockCreatePropertyType,
  mockCreateCompany,
  mockCreateField,
  mockCreateOperator,
  mockCreateCertificationAuthority,
  mockCreateDescriptionEvent,
  mockCreateTransformationEvent,
  mockCreateProposal,
  mockFinalizeBatch,
  populateStateWithMockData,
}
