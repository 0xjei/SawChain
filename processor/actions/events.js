
const {
  Operator,
  ProductType,
  EventParameterType,
  EventType,
  Company,
  Field,
  Batch,
  Event,
  Shared,
} = require('../services/proto')
const {
  reject,
  checkStateAddresses,
  isPresent,
} = require('../services/utils')
const {
  getOperatorAddress,
  getFieldAddress,
  getBatchAddress,
  FULL_PREFIXES,
  TYPE_PREFIXES,
} = require('../services/addressing')

/**
 * Check if the given value for the related parameter satisfies is constraints.
 * @param {Object} parameter The decoded Parameter state object.
 * @param {Object} value The value for the Parameter.
 * @param {Number} dataType The data type used for the parameter information.
 */
const checkParameterValue = (parameter, value, dataType) => {
  // Number data type.
  if (dataType === Shared.DataType.NUMBER) {
    // Validation: The value is lower than the Parameter minimum value constraint.
    if (value.numberValue < parameter.minValue) { reject(`The value ${value.numberValue} is lower than the Parameter minimum value constraint ${parameter.minValue}`) }

    // Validation: The value is greater than the Parameter maximum value constraint.
    if (value.numberValue > parameter.maxValue) { reject(`The value ${value.numberValue} is greater than the Parameter maximum value constraint ${parameter.maxValue}`) }
  }
  // String data type.
  else if (dataType === Shared.DataType.STRING) {
    // Validation: The value length is lower than the Parameter minimum length constraint.
    if (value.stringValue.length < parameter.minLength) { reject(`The value length ${value.stringValue.length} is lower than the Parameter minimum length constraint ${parameter.minLength}`) }

    // Validation: The value length is greater than the Parameter maximum length constraint.
    if (value.stringValue.length > parameter.maxLength) { reject(`The value length ${value.stringValue.length} is greater than the Parameter maximum length constraint ${parameter.maxLength}`) }
  }
}

/**
 * Record a new description Event updating the related Field or Batch events list.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} eventType The Event Type address.
 * @param {String} batch A company Batch address where recording the event.
 * @param {String} field A company Field address where recording the event.
 * @param {Object[]} values A list of values for each Parameter Type.
 */
async function createDescriptionEvent (
  context,
  signerPublicKey,
  timestamp,
  { eventType, batch, field, values },
) {
  // Validation: No Batch or Field specified.
  if (batch.length === 0 && field.length === 0) { reject('No Batch or Field specified') }

  // Validation: Either Batch and Field specified.
  if (batch.length > 0 && field.length > 0) { reject('Either Batch and Field specified') }

  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([operatorAddress])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const companyAddress = operatorState.company

  state = await context.getState([
    operatorAddress,
    companyAddress,
    eventType,
    field,
    batch,
  ])

  const companyState = Company.decode(state[companyAddress])
  const eventTypeState = EventType.decode(state[eventType])
  const fieldState = Field.decode(state[field])
  const batchState = Batch.decode(state[batch])

  if (field.length > 0) {
    // Validation: Field doesn't match a Company Field.
    await isPresent(companyState.fields, field, 'a Company Field')
  }

  if (batch.length > 0) {
    // Validation: Batch doesn't match a Company Batch.
    await isPresent(companyState.batches, batch, 'a Company Batch')
  }

  // Validation: At least one Event Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [eventType],
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.EVENT_TYPE,
    'Event Type',
  )

  // Validation: The Event Type is not a description Event Type.
  if (eventTypeState.typology !== EventType.Typology.DESCRIPTION) { reject(`The Event Type ${eventType} is not a description Event Type`) }

  // Validation: Operator task doesn't match an Event Type enabled task.
  await isPresent(eventTypeState.enabledTaskTypes, operatorState.task, 'an Event Type enabled task')

  if (field.length > 0) {
    // Validation: Field product doesn't match an Event Type enabled product.
    await isPresent(eventTypeState.enabledProductTypes, fieldState.product, 'an Event Type enabled product')
  }

  if (batch.length > 0) {
    // Validation: Batch product doesn't match an Event Type enabled product.
    await isPresent(eventTypeState.enabledProductTypes, batchState.product, 'an Event Type enabled product')

    // Validation: The Batch is finalized.
    if (batchState.finalization) { reject('The Batch is finalized') }
  }

  // Validation: No values specified for required Parameters.
  if (values.length !== eventTypeState.parameters.filter(p => p.required).length) { reject('No values specified for required Parameters') }

  // Validation: At least one Parameter Value is not valid for its related Parameter.
  for (const parameter of eventTypeState.parameters) {
    const eventParameterTypeAddress = parameter.eventParameterTypeAddress

    const state = await context.getState([eventParameterTypeAddress])

    const eventParameterTypeState = EventParameterType.decode(state[eventParameterTypeAddress])

    values.forEach(value => {
      if (eventParameterTypeAddress === value.parameterType) { checkParameterValue(parameter, value, eventParameterTypeState.dataType) }
    })
  }

  // State update.
  const updates = {}

  // Create an Event.
  const event = Event.create({
    eventType: eventType,
    reporter: signerPublicKey,
    values: values,
    quantity: 0,
    timestamp: timestamp,
  })

  // Record Event on Field.
  if (field.length > 0) {
    fieldState.events.push(event)
    updates[field] = Field.encode(fieldState).finish()
  }

  // Record Event on Batch.
  if (batch.length > 0) {
    batchState.events.push(event)
    updates[batch] = Batch.encode(batchState).finish()
  }

  await context.setState(updates)
}

/**
 * Record a new transformation Event updating the related Fields or Batches events list.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} eventType The Event Type address.
 * @param {String[]} batches A list of company Batches addresses to transform.
 * @param {String[]} fields A list of company Fields addresses to transform.
 * @param {float[]} quantities A list of corresponding quantities for transformation.
 * @param {String} derivedProduct The output Product Type address.
 * @param {String} outputBatchId The output Batch unique identifier.
 */
async function createTransformationEvent (
  context,
  signerPublicKey,
  timestamp,
  { eventType, batches, fields, quantities, derivedProduct, outputBatchId },
) {
  // Validation: No Batches or Fields list specified.
  if (batches.length === 0 && fields.length === 0) { reject('No Batches or Fields list specified') }

  // Validation: Either Batches and Fields lists specified.
  if (batches.length > 0 && fields.length > 0) { reject('Either Batches and Fields lists specified') }

  // Validation: No quantities list specified.
  if (quantities.length === 0) { reject('No quantities list specified') }

  // Validation: No output batch id specified.
  if (!outputBatchId) { reject('No output batch id specified') }

  const operatorAddress = getOperatorAddress(signerPublicKey)

  let state = await context.getState([operatorAddress])

  const operatorState = Operator.decode(state[operatorAddress])

  // Validation: The signer is not an Operator.
  if (operatorState.publicKey !== signerPublicKey) { reject('The signer is not an Operator') }

  const companyAddress = operatorState.company
  const outputBatchAddress = getBatchAddress(outputBatchId)

  state = await context.getState([
    companyAddress,
    eventType,
    outputBatchAddress,
  ])

  const companyState = Company.decode(state[companyAddress])
  const eventTypeState = EventType.decode(state[eventType])

  if (fields.length > 0) {
    // Validation: At least one Field state address is not a Company Field.
    for (const field of fields) {
      await isPresent(companyState.fields, field, 'a Company Field')
    }
  }

  if (batches.length > 0) {
    // Validation: At least one Batch state address is not a Company Batch.
    for (const batch of batches) {
      await isPresent(companyState.batches, batch, 'a Company Batch')
    }
  }

  // Validation: At least one Event Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [eventType],
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.EVENT_TYPE,
    'Event Type',
  )

  // Validation: The Event Type is not a transformation Event Type.
  if (eventTypeState.typology !== EventType.Typology.TRANSFORMATION) { reject(`The Event Type ${eventType} is not a transformation Event Type`) }

  // Validation: Operator task doesn't match an Event Type enabled task.
  await isPresent(eventTypeState.enabledTaskTypes, operatorState.task, 'an Event Type enabled task')

  // Get Fields and Batches states.
  const fieldsState = []
  const batchesState = []
  let inputProduct = null

  if (fields.length > 0) {
    // Get Fields decoded state objects.
    for (const field of fields) {
      const state = await context.getState([field])
      fieldsState.push(Field.decode(state[field]))
    }

    // Input product.
    inputProduct = fieldsState[0].product

    // At least a field doesn't match other Field's product Product Type.
    if (fieldsState.some(field => field.product !== fieldsState[fieldsState.length - 1].product)) { reject('A field doesn\'t match other Field\'s product Product Type') }

    // Validation: Fields Product Type doesn't match an Event Type enabled product.
    await isPresent(eventTypeState.enabledProductTypes, fieldsState[fieldsState.length - 1].product, 'an Event Type enabled product')
  }

  if (batches.length > 0) {
    for (const batch of batches) {
      const state = await context.getState([batch])
      batchesState.push(Batch.decode(state[batch]))
    }

    // Input product.
    inputProduct = batchesState[0].product

    // At least a batch doesn't match other Batch's product Product Type.
    if (batchesState.some(batch => batch.product !== batchesState[batchesState.length - 1].product)) { reject('A batch doesn\'t match other Batch\'s product Product Type') }

    // Validation: Batches Product Type doesn't match an Event Type enabled product.
    await isPresent(eventTypeState.enabledProductTypes, batchesState[batchesState.length - 1].product, 'an Event Type enabled product')

    // Validation: At least a Batch is finalized.
    if (batchesState.some(batch => batch.finalization)) { reject('At least a Batch is finalized') }
  }

  // Validation: Derived Product Type doesn't match a derived Event Type enabled product.
  await isPresent(eventTypeState.enabledDerivedProductTypes, derivedProduct, 'a derived Event Type enabled product')

  // Validation: Derived Product Type doesn't match a Company enabled product.
  await isPresent(companyState.enabledProductTypes, derivedProduct, 'a Company enabled product')

  // Validation: At least one quantity is not greater than zero.
  if (quantities.some(qnt => qnt <= 0)) { reject('At least one quantity is not greater than zero') }

  if (fields.length > 0) {
    // Validation: Quantities length doesn't match fields length.
    if (quantities.length !== fields.length) { reject('Quantities length doesn\'t match fields or batches length') }

    // Validation: A quantity is greater than current Field quantity.
    quantities.forEach((quantity, index) => {
      if (fieldsState[index].quantity - quantity < 0) { reject(`A quantity is greater than current Field quantity ${quantity}`) }
    })
  }

  if (batches.length > 0) {
    // Validation: Quantities length doesn't match batches length.
    if (quantities.length !== batches.length) { reject('Quantities length doesn\'t match batches or batches length') }

    // Validation: A quantity is greater than current Batch quantity.
    quantities.forEach((quantity, index) => {
      if (batchesState[index].quantity - quantity < 0) { reject(`A quantity is greater than current Batch quantity ${quantity}`) }
    })
  }

  /// Validation: Output Batch id is already used for another Company Batch.
  if (companyState.batches.some(batch => batch === outputBatchAddress)) { reject(`Output batch id ${outputBatchId} is already used for another Company Batch`) }

  // Retrieve conversion rate for derived product from Batch or Field product.
  state = await context.getState([inputProduct])

  const conversionRate = ProductType.decode(state[inputProduct])
    .derivedProductTypes.filter(product => product.productTypeAddress === derivedProduct)[0].conversionRate

  // State update.
  const updates = {}

  // Record Event for input Fields.
  if (fields.length > 0) {
    fieldsState.forEach((fieldState, i) => {
      const fieldAddress = getFieldAddress(fieldState.id, companyState.id)

      // Record Event on Field.
      fieldState.events.push(Event.create({
        eventType: eventType,
        reporter: signerPublicKey,
        values: [],
        quantity: quantities[i],
        timestamp: timestamp,
      }))

      // Update Field quantity.
      fieldState.quantity -= quantities[i]

      updates[fieldAddress] = Field.encode(fieldState).finish()
    })
  }

  // Record Event for input Batches.
  if (batches.length > 0) {
    batchesState.forEach((batchState, i) => {
      const batchAddress = getBatchAddress(batchState.id)

      // Record Event on Batch.
      batchState.events.push(Event.create({
        eventType: eventType,
        reporter: signerPublicKey,
        values: [],
        quantity: quantities[i],
        timestamp: timestamp,
      }))

      // Update Batch quantity.
      batchState.quantity -= quantities[i]

      updates[batchAddress] = Batch.encode(batchState).finish()
    })
  }

  // Record output Batch.
  updates[outputBatchAddress] = Batch.encode({
    id: outputBatchId,
    company: companyAddress,
    product: derivedProduct,
    quantity: quantities.reduce((tot, sum) => {
      return tot + sum
    }) * conversionRate,
    parentFields: fields,
    parentBatches: batches,
    events: [],
    certificates: [],
    properties: [],
    proposals: [],
    timestamp: timestamp,
  }).finish()

  // Update Company.
  companyState.batches.push(outputBatchAddress)
  updates[companyAddress] = Company.encode(companyState).finish()

  await context.setState(updates)
}

module.exports = {
  createDescriptionEvent,
  createTransformationEvent,
}
