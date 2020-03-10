'use strict'

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
    CreateTransformationEventAction
} = require('../../services/proto')

/**
 * Create and execute a create System Admin action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} privateKey The System Admin private key.
 */
const mockCreateSystemAdmin = async (context, handler, privateKey) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_SYSADMIN'],
            timestamp: Date.now()
        }),
        privateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Task Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Task Type unique identifier.
 * @param {String} role The Task Type role.
 */
const mockCreateTaskType = async (
    context,
    handler,
    systemAdminPrivateKey,
    id,
    role
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_TASK_TYPE'],
            timestamp: Date.now(),
            createTaskType: CreateTaskTypeAction.create({
                id: id,
                role: role
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Product Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Product Type unique identifier.
 * @param {String} name The Product Type name.
 * @param {String} description A short description.
 * @param {Number} measure The unit of measure of the product chosen from an enumeration of possible values.
 * @param {Object[]} derivedProducts A list of products which can be derived from the Product Type.
 */
const mockCreateProductType = async (
    context,
    handler,
    systemAdminPrivateKey,
    id,
    name,
    description,
    measure,
    derivedProducts
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_PRODUCT_TYPE'],
            timestamp: Date.now(),
            createProductType: CreateProductTypeAction.create({
                id: id,
                name: name,
                description: description,
                measure: measure,
                derivedProducts: derivedProducts
            })
        }),
        systemAdminPrivateKey
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
 * @param {Number} type The Event Parameter type chosen from an enumeration of possible values.
 */
const mockCreateEventParameterType = async (
    context,
    handler,
    systemAdminPrivateKey,
    id,
    name,
    type
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_EVENT_PARAMETER_TYPE'],
            timestamp: Date.now(),
            createEventParameterType: CreateEventParameterTypeAction.create({
                id: id,
                name: name,
                type: type
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Event Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Event Type unique identifier.
 * @param {Number} typology The Event Type typology which can be description or transformation.
 * @param {String} name The Event Type name.
 * @param {String} description A short description.
 * @param {String[]} parameters A list of ids of Event Parameter Types used to customize the Event Type information.
 * @param {String[]} enabledTaskTypes List of ids of Task Types that operators must have to record the Event Type.
 * @param {String[]} enabledProductTypes List of ids of Product Types where it will be possible to record the Event
 *     Type.
 * @param {String[]} derivedProductTypes List of Product Types identifiers derived from those enabled.
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
    derivedProductTypes
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_EVENT_TYPE'],
            timestamp: Date.now(),
            createEventType: CreateEventTypeAction.create({
                id: id,
                typology: typology,
                name: name,
                description: description,
                parameters: parameters,
                enabledTaskTypes: enabledTaskTypes,
                enabledProductTypes: enabledProductTypes,
                derivedProductTypes: derivedProductTypes
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Property Type action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} id The Property Type unique identifier.
 * @param {String} name The Property name.
 * @param {Number} type The Property type chosen from an enumeration of possible values.
 * @param {String[]} enabledTaskTypes List of ids of Task Types that operators must have to record the Property Type.
 * @param {String[]} enabledProductTypes List of ids of Product Types where it will be possible to record the Property
 *     Type.
 */
const mockCreatePropertyType = async (
    context,
    handler,
    systemAdminPrivateKey,
    id,
    name,
    type,
    enabledTaskTypes,
    enabledProductTypes
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_PROPERTY_TYPE'],
            timestamp: Date.now(),
            createPropertyType: CreatePropertyTypeAction.create({
                id: id,
                name: name,
                type: type,
                enabledTaskTypes: enabledTaskTypes,
                enabledProductTypes: enabledProductTypes
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}


/**
 * Create and execute a create Company action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {String} name The Company name.
 * @param {String} description A short description.
 * @param {String} website The Company official website.
 * @param {String} companyAdminPublicKey The Company Admin public key.
 * @param {String[]} enabledProductTypes List of ids of Product Types whose creation is enabled in the Company.
 */
const mockCreateCompany = async (
    context,
    handler,
    systemAdminPrivateKey,
    name,
    description,
    website,
    companyAdminPublicKey,
    enabledProductTypes
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_COMPANY'],
            timestamp: Date.now(),
            createCompany: CreateCompanyAction.create({
                name: name,
                description: description,
                website: website,
                admin: companyAdminPublicKey,
                enabledProductTypes: enabledProductTypes
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Field action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} companyAdminPrivateKey The Company Admin private key.
 * @param {String} id The Field unique identifier.
 * @param {String} description A short description.
 * @param {String} product The Product Type identifier which refers to the product grown in the Field.
 * @param {float} productQuantity The maximum production quantity of the Field.
 * @param {Object} location The approximate location in coordinates of the Field.
 */
const mockCreateField = async (
    context,
    handler,
    companyAdminPrivateKey,
    id,
    description,
    product,
    productQuantity,
    location
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_FIELD'],
            timestamp: Date.now(),
            createField: CreateFieldAction.create({
                id: id,
                description: description,
                product: product,
                quantity: productQuantity,
                location: location
            })
        }),
        companyAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Operator action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} companyAdminPrivateKey The Company Admin private key.
 * @param {String} optPublicKey The Operator public key.
 * @param {String} task The role chosen for the Operator task inside the Company.
 */
const mockCreateOperator = async (
    context,
    handler,
    companyAdminPrivateKey,
    optPublicKey,
    task
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_OPERATOR'],
            timestamp: Date.now(),
            createOperator: CreateOperatorAction.create({
                publicKey: optPublicKey,
                task: task
            })
        }),
        companyAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Certification Authority action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The System Admin private key.
 * @param {Object} publicKey The Certification Authority public key.
 * @param {String} name The Certification Authority name.
 * @param {String} website The Certification Authority official website.
 * @param {String[]} products List of ids of Product Types where the Certification Authority is enabled to issue
 *     certificates.
 */
const mockCreateCertificationAuthority = async (
    context,
    handler,
    systemAdminPrivateKey,
    publicKey,
    name,
    website,
    products
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_CERTIFICATION_AUTHORITY'],
            timestamp: Date.now(),
            createCertificationAuthority: CreateCertificationAuthorityAction.create({
                publicKey: publicKey,
                name: name,
                website: website,
                products: products
            })
        }),
        systemAdminPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Description Event action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} eventTypeId The Event Type unique identifier.
 * @param {String} batch The input Batch identifier where the Event should be recorded.
 * @param {String} field The input Field identifier where the Event should be recorded.
 * @param {Object[]} values List of ids of Event Parameter Value objects used to fill in the input parameters.
 *
 */
const mockCreateDescriptionEvent = async (
    context,
    handler,
    operatorPrivateKey,
    eventTypeId,
    batch,
    field,
    values
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_DESCRIPTION_EVENT'],
            timestamp: Date.now(),
            createDescriptionEvent: CreateDescriptionEventAction.create({
                eventTypeId: eventTypeId,
                field: field,
                batch: batch,
                values: values
            })
        }),
        operatorPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Create and execute a create Transformation Event action.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} operatorPrivateKey The Operator private key.
 * @param {String} eventTypeId The Event Type unique identifier.
 * @param {String[]} batches List of ids of Batch identifiers where the Event should be recorded.
 * @param {String[]} fields List of ids of Field identifiers where the Event should be recorded.
 * @param {float[]} quantities List of input quantities to subtract from input resources (batches/fields).
 * @param {String} derivedProduct The output Batch Product Type.
 * @param {String} outputBatchId The output Batch unique identifier.
 */
const mockCreateTransformationEvent = async (
    context,
    handler,
    operatorPrivateKey,
    eventTypeId,
    batches,
    fields,
    quantities,
    derivedProduct,
    outputBatchId
) => {
    const txn = new Txn(
        SCPayload.create({
            action: SCPayloadActions['CREATE_TRANSFORMATION_EVENT'],
            timestamp: Date.now(),
            createTransformationEvent: CreateTransformationEventAction.create({
                eventTypeId: eventTypeId,
                fields: fields,
                batches: batches,
                quantities: quantities,
                derivedProduct: derivedProduct,
                outputBatchId: outputBatchId
            })
        }),
        operatorPrivateKey
    )

    await handler.apply(txn, context)
}

/**
 * Populate the state object with a bunch of different combinations of types.
 * This function is made in order to simplify tests using a pre-defined set of types.
 * (nb. The information is for testing purposes only and is not intended for any production use).
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {SawChainHandlerWrapper} handler Instance of SawChain Transaction Handler wrapper.
 * @param {String} systemAdminPrivateKey The Operator private key.
 */
const populateStateWithMockData = async (
    context,
    handler,
    systemAdminPrivateKey
) => {
    // Task types.
    await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'task1', 'role1')
    await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'task2', 'role2')
    await mockCreateTaskType(context, handler, systemAdminPrivateKey, 'task3', 'role3')

    // Product Types.
    const derivedProd1 = ProductType['DerivedProduct'].create({
        derivedProductType: 'prd1',
        conversionRate: 0.8
    })

    const derivedProd2 = ProductType['DerivedProduct'].create({
        derivedProductType: 'prd2',
        conversionRate: 0.7
    })

    await mockCreateProductType(context, handler, systemAdminPrivateKey, 'prd1', 'name1', 'desc1', 3, []) // Bottles.
    await mockCreateProductType(context, handler, systemAdminPrivateKey, 'prd2', 'name2', 'desc2', 1, [derivedProd1]) // Olive
    await mockCreateProductType(context, handler, systemAdminPrivateKey, 'prd3', 'name3', 'desc3', 0, [derivedProd2]) // Olives.
    await mockCreateProductType(context, handler, systemAdminPrivateKey, 'prd4', 'name4', 'desc4', 0, [derivedProd2]) // Olives.

    // Event Parameter Types.
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param1', 'name1', 0)
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param2', 'name2', 1)
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param3', 'name3', 2)
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param4', 'name4', 0)
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param5', 'name5', 1)
    await mockCreateEventParameterType(context, handler, systemAdminPrivateKey, 'param6', 'name6', 2)

    // Event Types.
    const param1 = EventType['EventParameter'].create({
        parameterTypeId: 'param1',
        required: true,
        minValue: 10,
        maxValue: 100
    })
    const param2 = EventType['EventParameter'].create({
        parameterTypeId: 'param2',
        required: true,
        minLength: 3,
        maxLength: 10
    })
    const param3 = EventType['EventParameter'].create({
        parameterTypeId: 'param3',
        required: true
    })

    const param4 = EventType.EventParameter.create({
        parameterTypeId: 'param4',
        required: false,
        minValue: 10,
        maxValue: 100
    })
    const param5 = EventType['EventParameter'].create({
        parameterTypeId: 'param5',
        required: false,
        minLength: 1,
        maxLength: 10
    })
    const param6 = EventType['EventParameter'].create({
        parameterTypeId: 'param6',
        required: false
    })

    // Description events.
    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event1',
        EventType['EventTypology']['DESCRIPTION'],
        'name1',
        'desc1',
        [param1, param2, param3],
        ['task1'],
        ['prd3', 'prd2'],
        []
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event2',
        EventType['EventTypology']['DESCRIPTION'],
        'name2',
        'desc2',
        [param4, param5, param6],
        ['task1'],
        ['prd3', 'prd2'],
        []
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event3',
        EventType['EventTypology']['DESCRIPTION'],
        'name3',
        'desc3',
        [param1, param4],
        ['task1'],
        ['prd2'],
        []
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event4',
        EventType['EventTypology']['DESCRIPTION'],
        'name4',
        'desc4',
        [param4],
        ['task2'],
        ['prd2'],
        []
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event5',
        EventType['EventTypology']['DESCRIPTION'],
        'name5',
        'desc5',
        [],
        ['task1'],
        ['prd3', 'prd2'],
        []
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event6',
        EventType['EventTypology']['DESCRIPTION'],
        'name6',
        'desc6',
        [param1, param4],
        ['task1'],
        ['prd3', 'prd2'],
        []
    )

    // Transformation events.
    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event7',
        EventType['EventTypology']['TRANSFORMATION'],
        'name7',
        'desc7',
        [],
        ['task1'],
        ['prd3'],
        ['prd2']
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event8',
        EventType['EventTypology']['TRANSFORMATION'],
        'name8',
        'desc8',
        [],
        ['task2'],
        ['prd3'],
        ['prd2']
    )

    await mockCreateEventType(context, handler, systemAdminPrivateKey,
        'event9',
        EventType['EventTypology']['TRANSFORMATION'],
        'name9',
        'desc9',
        [],
        ['task1'],
        ['prd2'],
        ['prd1']
    )

    // Property Types.
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property1', 'name1', 0, ['task1'], ['prd2'])
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property2', 'name2', 1, ['task1'], ['prd2'])
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property3', 'name3', 2, ['task1'], ['prd2'])
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property4', 'name4', 3, ['task1'], ['prd2'])
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property5', 'name5', 0, ['task2'], ['prd2'])
    await mockCreatePropertyType(context, handler, systemAdminPrivateKey, 'property6', 'name6', 1, ['task1'], ['prd1'])
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
    populateStateWithMockData
}