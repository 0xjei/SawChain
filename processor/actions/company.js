
const {
  SystemAdmin,
  CompanyAdmin,
  Company,
  Field,
} = require('../services/proto')
const {
  reject,
  isValidPublicKey,
  isPublicKeyUsed,
  checkStateAddresses,
  isPresent,
} = require('../services/utils')
const {
  getSystemAdminAddress,
  getCompanyAdminAddress,
  getCompanyAddress,
  getFieldAddress,
  hashAndSlice,
  FULL_PREFIXES,
  TYPE_PREFIXES,
} = require('../services/addressing')

/**
 * Record a new Company and related Company Admin into the state.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} name The Company name.
 * @param {String} description A short description of the Company.
 * @param {String} website The Company website.
 * @param {String} admin The Company Admin's public key.
 * @param {String[]} enabledProductTypes A list of enabled Product Types addresses used in the Company.
 */
async function createCompany (
  context,
  signerPublicKey,
  timestamp,
  { name, description, website, admin, enabledProductTypes },
) {
  // Validation: No name specified.
  if (!name) { reject('No name specified') }

  // Validation: No description specified.
  if (!description) { reject('No description specified') }

  // Validation: No website specified.
  if (!website) { reject('No website specified') }

  // Validation: Admin field doesn't contain a valid public key.
  if (!isValidPublicKey(admin)) { reject('The admin field doesn\'t contain a valid public key') }

  const systemAdminAddress = getSystemAdminAddress()

  const state = await context.getState([systemAdminAddress])

  const systemAdminState = SystemAdmin.decode(state[systemAdminAddress])

  // Validation: The signer is not the System Admin.
  if (systemAdminState.publicKey !== signerPublicKey) { reject('The signer is not the System Admin') }

  // Validation: The public key belongs to another authorized user.
  await isPublicKeyUsed(context, admin)

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    enabledProductTypes,
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  // State update.
  const updates = {}

  // Calculate Company id from Company Admin's public key.
  const id = hashAndSlice(admin, 10)
  const companyAddress = getCompanyAddress(id)

  // Record Company Admin.
  updates[getCompanyAdminAddress(admin)] = CompanyAdmin.encode({
    publicKey: admin,
    company: companyAddress,
    timestamp: timestamp,
  }).finish()

  // Recording Company.
  updates[companyAddress] = Company.encode({
    id: id,
    name: name,
    description: description,
    website: website,
    adminPublicKey: admin,
    enabledProductTypes: enabledProductTypes,
    fields: [],
    operators: [],
    batches: [],
    timestamp: timestamp,
  }).finish()

  await context.setState(updates)
}

/**
 * Record a new Field into the state and update the related Company fields list.
 * @param {Context} context Object used to write/read into Sawtooth ledger state.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id The Field unique identifier.
 * @param {String} description A short description of the Field.
 * @param {String} product The Product Type address of the cultivable product.
 * @param {Number} quantity The predicted maximum production quantity.
 * @param {Object} location The Field approximate location coordinates.
 */
async function createField (
  context,
  signerPublicKey,
  timestamp,
  { id, description, product, quantity, location },
) {
  // Validation: No id specified.
  if (!id) { reject('No id specified') }

  // Validation: No description specified.
  if (!description) { reject('No description specified') }

  // Validation: No location specified.
  if (!location) { reject('No location specified') }

  const companyAdminAddress = getCompanyAdminAddress(signerPublicKey)

  let state = await context.getState([
    companyAdminAddress,
    product,
  ])

  const companyAdminState = CompanyAdmin.decode(state[companyAdminAddress])

  // Validation: The signer is not a Company Admin.
  if (companyAdminState.publicKey !== signerPublicKey) { reject('You must be a Company Admin with a Company to create a Field') }

  // Validation: At least one Product Type address is not well-formatted or not exists.
  await checkStateAddresses(
    context,
    [product],
    FULL_PREFIXES.TYPES + TYPE_PREFIXES.PRODUCT_TYPE,
    'Product Type',
  )

  const fieldAddress = getFieldAddress(id, hashAndSlice(signerPublicKey, 10))

  state = await context.getState([
    fieldAddress,
    companyAdminState.company,
  ])

  const companyState = Company.decode(state[companyAdminState.company])

  // Validation: Product field doesn't match an enabled Company Product Type address.
  await isPresent(companyState.enabledProductTypes, product, 'an enabled Company Product')

  // Validation: Quantity must be greater than zero.
  if (!quantity > 0) { reject(`Specified quantity is not greater than zero: ${quantity}`) }

  // Validation: The id belongs to another company Field.
  if (state[fieldAddress].length > 0) { reject(`The id ${id} belongs to another company Field`) }

  // State update.
  const updates = {}

  // Record field.
  updates[fieldAddress] = Field.encode({
    id: id,
    description: description,
    company: companyAdminState.company,
    product: product,
    quantity: quantity,
    location: location,
    events: [],
  }).finish()

  // Update company.
  companyState.fields.push(fieldAddress)
  updates[companyAdminState.company] = Company.encode(companyState).finish()

  await context.setState(updates)
}

module.exports = {
  createCompany,
  createField,
}
