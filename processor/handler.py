from processor import addressing
import logging
import time

from sawtooth_sdk.processor.exceptions import InvalidTransaction
from sawtooth_sdk.processor.exceptions import InternalError
from sawtooth_sdk.protobuf.transaction_pb2 import TransactionHeader

from processor.protobuf.agent_pb2 import Agent
from processor.protobuf.agent_pb2 import AgentContainer

from processor.protobuf.batch_pb2 import Batch
from processor.protobuf.batch_pb2 import BatchContainer

from processor.protobuf.company_pb2 import Company
from processor.protobuf.company_pb2 import CompanyContainer

from processor.protobuf.event_pb2 import Event
from processor.protobuf.event_pb2 import EventContainer
from processor.protobuf.event_pb2 import HarvestedInfo
from processor.protobuf.event_pb2 import TrasformationInfo
from processor.protobuf.event_pb2 import CertificationInfo
from processor.protobuf.event_pb2 import GenericInfo

from processor.protobuf.product_pb2 import Product
from processor.protobuf.product_pb2 import ProductContainer

from processor.protobuf.property_pb2 import Property
from processor.protobuf.property_pb2 import PropertyContainer
from processor.protobuf.property_pb2 import PropertyPage
from processor.protobuf.property_pb2 import PropertyPageContainer

from processor.protobuf.proposal_pb2 import Proposal
from processor.protobuf.proposal_pb2 import ProposalContainer

from processor.protobuf.payload_pb2 import SCPayload

from sawtooth_signing import create_context
from sawtooth_signing import CryptoFactory

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.DEBUG)


PROPERTY_PAGE_MAX_LENGTH = 256
TOTAL_PROPERTY_PAGE_MAX = 16 ** 4 - 1



class ACTransactionHandler:
    @property
    def family_name(self):
        return addressing.FAMILY_NAME

    @property
    def family_versions(self):
        return ['1.0']

    @property
    def namespaces(self):
        return [addressing.NAMESPACE]


    def apply(self, transaction, state):
        '''
        A ACPayload consiste di un timestamp, un action tag e gli attributi
        corrispondenti alle varie azioni (create_agent, create_batch, etc).
        L'attributo appropiato è selezionato in base all'action tag, e le informazioni
        più il timestamp e la chiave pubblica utilizzata per firmare la transazione, sono
        passate ad un appropiata funzione di handling (_create_agent, _create_batch, etc).

        _unpack_transaction() prende la signing key, the timestamp, and
        the action tag dalla transazione, poi restituisce essi all'appropiato
        handler 

        Oltre a questo, il timestamp della transazione è verificato, poiché
        la validazione è comune ad ogni transazione
        '''
        signer, timestamp, payload, handler = _unpack_transaction(transaction)

        handler(payload, signer, timestamp, state)


''' HANDLERS '''

def _create_agent(payload, signer, timestamp, state):

    # check empty fields
    if not payload.name:
        raise InvalidTransaction('Agent name cannot be empty string')

    if not payload.id:
        raise InvalidTransaction('Agent id cannot be empty string')

    # check agentType
    agent_type = _check_agentType(state, payload.type)

    company = None

    # Create Business Admin
    if agent_type == Agent.AgentType.BUSINESS_ADMIN:

        # Check if signer is a System Admin
        _verify_signer(state, signer, Agent.AgentType.SYSTEM_ADMIN)

        # Verify that public_key has been registered as an agent
        _verify_agent(state, payload.public_key)
    
    # Create Certifier
    elif agent_type == Agent.AgentType.CERTIFIER:

        # Check if signer is a System Admin
        _verify_signer(state, signer, Agent.AgentType.SYSTEM_ADMIN)

        # Verify that public_key has been registered as an agent
        _verify_agent(state, payload.public_key)

    # Create Operator
    elif agent_type == Agent.AgentType.OPERATOR:

        # Check if signer is a Business Admin
        _verify_signer(state, signer, Agent.AgentType.BUSINESS_ADMIN)
        
        # Check if Business Admin is enabled
        _verify_enablement(state, signer, Agent.AgentType.BUSINESS_ADMIN)

        # Check if Business Admin have already created the company in the system 
        _verify_company(state, signer, Agent.AgentType.BUSINESS_ADMIN)

        # Verify that public_key has been registered as an agent
        _verify_agent(state, payload.public_key, agent_type)

        # Verify that id has been registered for another Operator in the company
        _verify_same_operator_id(state, payload.public_key, agent_type)

        # All checks passed            

    # Saving the new Agent in the right address
    agent = Agent(
        public_key=payload.public_key,
        name=payload.name,
        timestamp=timestamp,
        id = payload.id,
        type = payload.type,
        authorizer = signer,
        company = _get_company_from_ba(state, signer),
        enabled = True,
    )

    address = addressing.make_agent_address(payload.public_key, payload.type)
    container = _get_container(state, address)

    container.entries.extend([agent])
    container.entries.sort(key=lambda ag: ag.public_key)

    _set_container(state, address, container)

def _revoke_agent(payload, signer, timestamp, state):
    pass

def _create_company(payload, signer, timestamp, state):
    pass

def _create_field(payload, signer, timestamp, state):
    pass

def _record_product(payload, signer, timestamp, state):
    '''
    * Check if the signer is a BA
    * Check if the signer is enabled
    * Check BA company
    * Check role match
    * Check if product exists
    * Harvested
        * Check if field exists
    * Create the record
    '''
    
    # Check if the signer is a BA
    agent, agent_container, agent_address = _get_agent(state, signer)

    if agent.type != Agent.BUSINESS_ADMIN:
        raise InvalidTransaction('Agent must be a registered Business Admin to perform this action')

    # Check if the signer is enabled
    if agent.enabled != True:
        raise InvalidTransaction('Agent must is no longer enabled to perform this action')

    # Check BA company
    company, company_container, company_address = _get_company(state, agent.company)

    # Check role match
    if all(company.role != payload.type for role in company.roles):
        raise InvalidTransaction('Product Type must match with a Company role')

    # Check if product exists
    _verify_product(state, payload.name, company)

    # Harvested
    if payload.type == Product.HARVESTED:
        # Check if field exists
        if all(field.id_field != payload.id_field for field in company.fields):
            raise InvalidTransaction('Field not exists')
            
    # Create the record
    product = Product(
        name=payload.name,
        company=company.company_fc,
        info=payload.info,
        type=payload.type,
        field=payload.id_field,
        timestamp=timestamp,
    )
    product_address = addressing.make_product_address(payload.name, company)
    product_container = _get_container(state, product_address)

    product_container.entries.extend([product])
    product_container.entries.sort(key=lambda pr: pr.name)

    _set_container(state, product_address, product_container)

def _record_harvest(payload, signer, timestamp, state):
    pass
    
def _record_trasformation(payload, signer, timestamp, state):
    pass

def _create_batch(payload, signer, timestamp, state):
    '''
    * Check all payload data is not None
    * Check signer is an Operator
    * Check is enabled
    * Check if Role of Company Operator is Production or Processing
    * Check if the Batch id is already present in the company
    * Check if the Product is present in the company
    * Check if the Event id refers some Harvest or Trasformation in the company 
    * Check if temperature is true
    * Check if location is true
    '''
    company = None

    # Get data from payload
    batch_id = payload.batch_id
    if not batch_id:
        raise InvalidTransaction('Batch id cannot be empty string')

    product = payload.product
    if not product:
        raise InvalidTransaction('Product name cannot be empty string')

    info = payload.info
    if not info.size or not info.weight or not info.n_items:
        raise InvalidTransaction('You must provide the size, weight and item number')

    event = payload.event_id
    if not event:
        raise InvalidTransaction('You must provide the Harvested or Trasformation event id')

    temp = payload.temperature
    loc = payload.location

    # Check signer is an Operator
    signer_address = addressing.make_agent_address(signer, Agent.AgentType.OPERATOR)
    signer_container = _get_container(state, signer_address)

    for agent in signer_address.entries:
        if any(agent.public_key != signer):
            raise InvalidTransaction('You\'re not an Operator')
        # Check is enabled
        elif agent.enabled != True:
            raise InvalidTransaction('You\'re not enabled anymore') 
        else:
            company = agent.company

    # Check Company role
    company_address = addressing.make_agent_address(company)
    company_container = _get_container(state, company_address)

    for cp in company_address.entries:
        if any(cp.company_fc != company):
            raise InvalidTransaction('You\'re part of a company not registered')
        else:
            for role in cp.roles:
                if role != Company.Role.PRODUCTION or role != Company.Role.PROCESSING:
                    raise InvalidTransaction('You\'re not able to create batch inside your company')
    
    # Check if the Batch id is already present in the company
    batch_address = addressing.make_agent_address(batch_id, company)
    batch_container = _get_container(state, batch_address)

    if any(batch.id == batch_id for batch in batch_container.entries):
        raise InvalidTransaction('Batch {} already exists'.format(batch_id))
    
    # Check if product is present
    product_address = addressing.make_product_address(company)
    product_container = _get_container(state, product_address)
    
    for prod in product_container.entries:
        if prod.name != product:
            raise InvalidTransaction('Product {} cannot exists in the company'.format(batch_id))
        else:
            # Get product type 
            prod_type = prod.type
            
            if prod_type == Product.ProductType.HARVESTED:
                # Check event id
                event_address = addressing.make_event_company_address(company, event)
                event_container = _get_container(state, event_address)

                for event in event_container.entries:
                    if event.id == event and event.type != Event.EventType.HARVESTED:
                        raise InvalidTransaction('No Harvested events here')
            elif prod_type == Product.ProductType.TRASFORMATION:
                    # Check event id
                    event_address = addressing.make_event_company_address(company, event)
                    event_container = _get_container(state, event_address)

                    for event in event_container.entries:
                        if event.id == event and event.type != Event.EventType.TRASFORMATION:
                            raise InvalidTransaction('No Trasformation events here')
            

    # Checks passed
    address = addressing.make_batch_address(batch_id)
    container = _get_container(state, address)

    batch = Batch(
        id = batch_id,
        product_id = product,
        operators = [Batch.Reporter(
            public_key = signer,
            event_id = event,
            timestamp = timestamp,
        )],
        companies = [Batch.Company(
            id = company,
            timestamp = timestamp,
        )],
        end = False,
        info = [Batch.Info(
            size = payload.info.size,
            weight = payload.info.weight,
            n_items = payload.info.n_items,
            docs = [Batch.Document(
                url = payload.info.docs.url,
                hash = payload.info.docs.hash,
                description = payload.info.docs.description,
            )],
        )],
        timestamp = timestamp,
    )

    container.entries.extend([batch])
    container.entries.sort(key=lambda ag: ag.id)

    _set_container(state, address, container)

    # Check Temperature and Location
    # Create the associated properties
    if temp == True:
        _make_new_property(
            state = state,
            batch_id = batch_id,
            type = Property.PropertyType.TEMPERATURE,
            signer = signer,
        )

        _make_new_property_page(
            state=state,
            signer = signer,
            batch_id = batch_id,
            type = Property.PropertyType.TEMPERATURE,
            timestamp=timestamp,
            page_number=1,
            value = None,
        )
    
    if loc == True:
        _make_new_property(
            state = state,
            batch_id = batch_id,
            type = Property.PropertyType.LOCATION,
            signer = signer,
        )

        _make_new_property_page(
            state=state,
            signer = signer,
            batch_id = batch_id,
            type = Property.PropertyType.LOCATION,
            timestamp=timestamp,
            page_number=1,
            value = None,
        )

def _record_generic(payload, signer, timestamp, state):
    pass

def _finalize_batch(payload, signer, timestamp, state):
    pass

def _record_certification(payload, signer, timestamp, state):
    pass

def _create_proposal(payload, signer, timestamp, state):
    pass

def _answer_proposal(payload, signer, timestamp, state):
    pass

def _update_property(payload, signer, timestamp, state):
    pass

''' HELPERS '''

def _get_container(state, address):
    # Get the appropriate container type based on the address
    namespace = address[6:8]

    containers = {
        addressing.AGENT: AgentContainer,
        addressing.PROPERTY: (PropertyContainer
                              if address[-4:] == '0000'
                              else PropertyPageContainer),
        addressing.PROPOSAL: ProposalContainer,
        addressing.COMPANY: CompanyContainer,
        addressing.PRODUCT: ProductContainer,
        addressing.BATCH: BatchContainer,
        addressing.EVENT: EventContainer,
    }

    container = containers[namespace]()

    # Get data from state
    entries = state.get_state([address])

    if entries:
        data = entries[0].data
        container.ParseFromString(data)

    return container

def _set_container(state, address, container):
    addresses = state.set_state({
        address: container.SerializeToString()
    })

    if not addresses:
        raise InternalError(
            'State error -- failed to set state entries')    

def _check_agentType(state, agent_type):
    # Check if agentType is empty or is not valid
    if not agent_type:
        raise InvalidTransaction('Agent type cannot be empty')

    if agent_type == Agent.AgentType.BUSINESS_ADMIN:
        return Agent.AgentType.BUSINESS_ADMIN
    elif agent_type == Agent.AgentType.CERTIFIER:
        return Agent.AgentType.CERTIFIER
    elif agent_type == Agent.AgentType.OPERATOR:
        return Agent.AgentType.OPERATOR
    else:
        raise InvalidTransaction('Invalid Agent Type')

def _verify_signer(state, public_key, agent_type):
    address = addressing.make_agent_address(public_key, agent_type)
    container = _get_container(state, address)

    if all(agent.public_key != public_key for agent in container.entries):
        raise InvalidTransaction('The signer does not have permission to perform this action')

def _verify_agent(state, public_key, agent_type):

    for agent_type in Agent.AgentType:
        ''' Verify that public_key has been registered as an agent '''
        address = addressing.make_agent_address(public_key, agent_type)
        container = _get_container(state, address)

        if all(agent.public_key == public_key for agent in container.entries):
            raise InvalidTransaction('Agent with public_key already exists')

def _verify_enablement(state, public_key, agent_type):
    address = addressing.make_agent_address(public_key, agent_type)
    container = _get_container(state, address)

    if all(agent.public_key == public_key and agent.enabled == True for agent in container.entries):
        raise InvalidTransaction('Agent is not enabled')

        if all(agent.public_key == signer and agent.company != None for agent in container.entries):
            raise InvalidTransaction('Agent doesn\'t have registered a company')
        if all(agent.public_key == signer and agent.company != None for agent in container.entries):
            raise InvalidTransaction('Agent doesn\'t have registered a company')

def _verify_company(state, public_key, agent_type):
    address = addressing.make_agent_address(public_key, agent_type)
    container = _get_container(state, address)

    if all(agent.public_key == public_key and agent.company == None for agent in container.entries):
        raise InvalidTransaction('Agent doesn\'t have registered a company')

def _verify_same_operator_id(state, public_key, agent_type, op_id):
    address = addressing.make_agent_address(public_key, agent_type)
    container = _get_container(state, address)

    for agent in container.entries:
        if agent.public_key == public_key and agent.company != None:
            # Getting company address
            address = addressing.make_company_address(public_key, agent.company)
            company_container = _get_container(state, address)

            for comp in company_container.entries:
                if agent.company == comp.company_fc:
                    for operator in comp.operators:
                        if operator.id == op_id:
                            raise InvalidTransaction('There is already an Operator with the same id in the company')

def _get_company_from_ba(state, public_key):
    address = addressing.make_agent_address(public_key, Agent.AgentType.BUSINESS_ADMIN)
    container = _get_container(state, address)

    for agent in container.entries:
        if (agent.public_key == public_key and agent.company != None):
            return agent.company
        else:
            raise InvalidTransaction('Agent doesn\'t have registered a company')
            
def _make_new_property(state, batch_id, prop_type, signer):
    property_address = addressing.make_property_address(batch_id, 0)

    property_container = _get_container(state, property_address)

    new_prop = Property(
        batch_id = batch_id,
        type = prop_type,
        current_page=1,
        wrapped=False,
    )

    property_container.entries.extend([new_prop])
    property_container.entries.sort(key=lambda prop: prop.batch_id)

    _set_container(state, property_address, property_container)

def _make_new_property_page(state, signer, batch_id, prop_type, timestamp, page_number, value):
    page_address = addressing.make_property_address(prop_type, batch_id, page_number)

    page_container = _get_container(state, page_address)

    page = PropertyPage(
        type = prop_type,
        batch_id = batch_id,
    )

    if prop_type == Property.PropertyType.TEMPERATURE:
        reported_value = PropertyPage.ReportedValue(
            pub_key = signer,
            timestamp = timestamp,
            temperature = value
        )

        page.reported_values.extend([reported_value])

    if prop_type == Property.PropertyType.LOCATION:
        reported_value = PropertyPage.ReportedValue(
            pub_key = signer,
            timestamp = timestamp,
            location = [PropertyPage.Location(
                latitude = value.latitude,
                longitude = value.longitude,
            )],
        )

        page.reported_values.extend([reported_value])

    page_container.entries.extend([page])
    page_container.entries.sort(key=lambda page: page.type)

    _set_container(state, page_address, page_container)

def _get_agent(state, agent_key):
    ''' Return agent, agent_container, agent_address '''
    agent_address = addressing.make_agent_address(agent_key)
    agent_container = _get_container(state, agent_address)

    try:
        agent = next(
            agent
            for agent in agent_container.entries
            if agent.public_key == agent_key
        )
    except StopIteration:
        raise InvalidTransaction(
            'Agent does not exist')

    return agent, agent_container, agent_address

def _get_company(state, company_fc):
    ''' Return company, company_container, company_address '''
    company_address = addressing.make_agent_address(company_fc)
    company_container = _get_container(state, company_address)

    try:
        company = next(
            company
            for company in company_container.entries
            if company.company_fc == company_fc
        )
    except StopIteration:
        raise InvalidTransaction(
            'Company does not exist')

    return company, company_container, company_address

def _verify_product(state, name, company):
    ''' Verify that product has been registered '''
    address = addressing.make_product_address(name, company)
    container = _get_container(state, address)

    if all(pr.name == name for pr in container.entries):
        raise InvalidTransaction(
            'Same product exists')

def _unpack_transaction(transaction):

    signer = transaction.header.signer_public_key

    payload = SCPayload()
    payload.ParseFromString(transaction.payload)

    action = payload.action
    timestamp = payload.timestamp

    try:
        attribute, handler = TYPE_TO_ACTION_HANDLER[action]
    except KeyError:
        raise Exception('Specified action is invalid')

    payload = getattr(payload, attribute)

    return signer, timestamp, payload, handler

TYPE_TO_ACTION_HANDLER = {
    SCPayload.CREATE_AGENT: ('create_agent', _create_agent),
    SCPayload.REVOKE_AGENT: ('revoke_agent', _revoke_agent),
    SCPayload.CREATE_COMPANY: ('create_company', _create_company),
    SCPayload.CREATE_FIELD: ('create_field', _create_field),
    SCPayload.RECORD_PRODUCT: ('record_product', _record_product),
    SCPayload.RECORD_HARVEST: ('record_harvest', _record_harvest),
    SCPayload.RECORD_TRASFORMATION: ('record_trasformation', _record_trasformation),
    SCPayload.CREATE_BATCH: ('create_batch', _create_batch),
    SCPayload.RECORD_GENERIC: ('record_generic', _record_generic),
    SCPayload.FINALIZE_BATCH: ('finalize_batch', _finalize_batch),
    SCPayload.RECORD_CERTIFICATION: ('record_certification', _record_certification),
    SCPayload.CREATE_PROPOSAL: ('create_proposal', _create_proposal),
    SCPayload.ANSWER_PROPOSAL: ('answer_proposal', _answer_proposal),
    SCPayload.UPDATE_PROPERTY: ('update_property', _update_property),
}
