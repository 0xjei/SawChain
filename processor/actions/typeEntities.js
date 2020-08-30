
const {
  SystemAdmin,
  TaskType,
  ProductType,
  EventParameterType,
  EventType,
  PropertyType,
  Shared,
} = require('../services/proto')
const {
  reject,
  checkStateAddresses,
} = require('../services/utils')
const {
  getTaskTypeAddress,
  getSystemAdminAddress,
  getProductTypeAddress,
  getEventParameterTypeAddress,
  getEventTypeAddress,
  getPropertyTypeAddress,
  FULL_PREFIXES,
  TYPE_PREFIXES,
} = require('../services/addressing')

/**
 * Record a new Task Type into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Task Type unique identifier.
 * @param {String} task The Task Type name.
 */
async function createTaskType (context, signerPublicKey, timestamp, { id, task }) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: No task specified.
  if (!task) { reject('No task specified') }

  const systemAdminAddress = getSystemAdminAddress()
  const taskTypeAddress = getTaskTypeAddress(id)

  const state = await context.getState([
    systemAdminAddress,
    taskTypeAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The id belongs to another Task Type.
  if (state[taskTypeAddress].length > 0) { reject(`The id ${id} belongs to another Task Type`) }

  // State update.
  const updates = {}

  updates[taskTypeAddress] = TaskType.encode({
    id: id,
    task: task,
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Product Type into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Product Type unique identifier.
 * @param {String} name The Product name.
 * @param {String} description A short description of the product.
 * @param {Number} measure The unit of measure used for the product quantity.
 * @param {Object[]} derivedProductTypes A list of derived Product Types with a quantity conversion rate.
 */
async function createProductType (
  context,
  signerPublicKey,
  timestamp,
  { id, name, description, measure, derivedProductTypes },
) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: Measure doesn't match one any possible value.
  if (!Object.values(Shared.UnitOfMeasure).some(value => value === measure)) { reject('Measure doesn\'t match one any possible value') }

  const systemAdminAddress = getSystemAdminAddress()
  const productTypeAddress = getProductTypeAddress(id)

  const state = await context.getState([
    systemAdminAddress,
    productTypeAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The id belongs to another Product Type.
  if (state[productTypeAddress].length > 0) { reject(`The id ${id} belongs to another Product Type`) }

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    derivedProductTypes.map(dpt => dpt.productTypeAddress),
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  for (const derivedProductType of derivedProductTypes) {
    // Validation: Conversion rate must be greater than zero.
    if (!derivedProductType.conversionRate > 0) { reject(`Specified conversion rate is not greater than zero: ${derivedProductType.conversionRate}`) }
  }

  // State update.
  const updates = {}

  updates[productTypeAddress] = ProductType.encode({
    id: id,
    name: name,
    description: description,
    measure: measure,
    derivedProductTypes: derivedProductTypes,
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Event Parameter Type into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Event Parameter Type unique identifier.
 * @param {String} name The Event Parameter Type name.
 * @param {Number} dataType The data type used for the parameter information.
 */
async function createEventParameterType (
  context,
  signerPublicKey,
  timestamp,
  { id, name, dataType },
) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: DataType doesn't match one any possible value.
  if (!Object.values(Shared.DataType).some((value) => value === dataType)) { reject('Data type doesn\'t match one any possible value') }

  const systemAdminAddress = getSystemAdminAddress()
  const eventParameterTypeAddress = getEventParameterTypeAddress(id)

  const state = await context.getState([
    systemAdminAddress,
    eventParameterTypeAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The id belongs to another Event Parameter Type.
  if (state[eventParameterTypeAddress].length > 0) { reject(`The id ${id} belongs to another Event Parameter Type`) }

  // State update.
  const updates = {}

  updates[eventParameterTypeAddress] = EventParameterType.encode({
    id: id,
    name: name,
    dataType: dataType,
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Event Type into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Event Type unique identifier.
 * @param {Number} typology The Event Type typology.
 * @param {String} name The Event Type name.
 * @param {String} description A short description of the event.
 * @param {String[]} enabledTaskTypes A list of enabled Task Types addresses for recording the event.
 * @param {String[]} enabledProductTypes A list of enabled Product Types addresses where recording the event.
 * @param {String[]} parameters A list of Event Parameters with additional features.
 * @param {String[]} enabledDerivedProductTypes A list of enabled derived Product Types addresses for the transformation of the product.
 */
async function createEventType (
  context,
  signerPublicKey,
  timestamp,
  {
    id,
    typology,
    name,
    description,
    enabledTaskTypes,
    enabledProductTypes,
    parameters,
    enabledDerivedProductTypes,
  },
) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: Typology doesn't match one any possible value.
  if (!Object.values(EventType.Typology).some((value) => value === typology)) { reject('Typology doesn\'t match one any possible value') }

  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: No description specified.
  if (!description) { reject('No description specified') }

  const systemAdminAddress = getSystemAdminAddress()
  const eventTypeAddress = getEventTypeAddress(id)

  const state = await context.getState([
    systemAdminAddress,
    eventTypeAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])
  let derivedProductTypes = []

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The id belongs to another Event Type.
  if (state[eventTypeAddress].length > 0) { reject(`The id ${id} belongs to another Event Type`) }

  // Validation: At least one Task Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledTaskTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.TASK_TYPE,
    'Task Type',
  )

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledProductTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  // Validation: At least one Event Parameter Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    parameters.map(ept => ept.eventParameterTypeAddress),
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.EVENT_PARAMETER_TYPE,
    'Event Parameter Type',
  )

  // Validation: No derived products specified for an event with transformation typology.
  if (typology === EventType.Typology.TRANSFORMATION && enabledDerivedProductTypes.length === 0) { reject('No derived products for transformation event typology') }

  // Get derived Product Type from enabled Product Type
  for (const enabledProductType of enabledProductTypes) {
    const state = await context.getState([enabledProductType])

    // Update derived Product Types list from enabled Product Types lists.
    derivedProductTypes = derivedProductTypes.concat(ProductType.decode(state[enabledProductType]).derivedProductTypes)
  }

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledDerivedProductTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Derived Product Type',
  )

  // Validation: At least one derived Product Type doesn't match a valid derived product for enabled Product Types.
  for (const derivedProductType of enabledDerivedProductTypes) {
    // Validation: At least one derived Product Type doesn't match a valid derived product for enabled Product Types.
    if (!derivedProductTypes.some(derivedPT => derivedPT.productTypeAddress === derivedProductType)) { reject(`Specified derived Product Type does not match a valid derived product for enabled Product Types: ${derivedProductType}`) }
  }

  // State update.
  const updates = {}

  updates[eventTypeAddress] = EventType.encode({
    id: id,
    typology: typology,
    name: name,
    description: description,
    enabledTaskTypes: enabledTaskTypes,
    enabledProductTypes: enabledProductTypes,
    parameters: parameters,
    enabledDerivedProductTypes: typology === EventType.Typology.TRANSFORMATION ? enabledDerivedProductTypes : [],
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Property Type into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Property Type unique identifier.
 * @param {String} name The Property Type name.
 * @param {Number} dataType Property type from enumeration of possible values.
 * @param {String[]} enabledTaskTypes List of identifiers of Task Types which Operators must have to record the Property Type.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the Property Type can be recorded.
 */
async function createPropertyType (
  context,
  signerPublicKey,
  timestamp,
  {
    id,
    name,
    dataType,
    enabledTaskTypes,
    enabledProductTypes,
  },
) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: Data type doesn't match one any possible value.
  if (!Object.values(Shared.DataType).some((value) => value === dataType)) { reject('Data type doesn\'t match one any possible value') }

  const systemAdminAddress = getSystemAdminAddress()
  const propertyTypeAddress = getPropertyTypeAddress(id)

  const state = await context.getState([
    systemAdminAddress,
    propertyTypeAddress,
  ])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The id belongs to another Property Type.
  if (state[propertyTypeAddress].length > 0) { reject(`The id ${id} belongs to another Property Type`) }

  // Validation: At least one Task Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledTaskTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.TASK_TYPE,
    'Task Type',
  )

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledProductTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  // State update.
  const updates = {}

  updates[propertyTypeAddress] = PropertyType.encode({
    id: id,
    name: name,
    dataType: dataType,
    enabledTaskTypes: enabledTaskTypes,
    enabledProductTypes: enabledProductTypes,
  }).finish()

  await context.setState(updates)
}

module.exports = {
  createTaskType,
  createProductType,
  createEventParameterType,
  createEventType,
  createPropertyType,
}
