import hashlib
from enum import Enum

def _hash(string):
    return hashlib.sha512(string.encode('utf-8')).hexdigest()

FAMILY_NAME = 'AgriChain'

NAMESPACE = _hash(FAMILY_NAME)[:6]

AGENT = 'AG'
COMPANY = 'CO'
PRODUCT = 'PR'
BATCH = 'BT'
EVENT_COMPANY = 'EC'
EVENT_BATCH = 'EB'
PROPERTY = 'PT'
PROPOSAL = 'PP'

def make_agent_address(identifier):
    return (
        NAMESPACE
        + AGENT
        + _hash(identifier)[:62]
    )


def make_company_address(company_cf):
    return (
        NAMESPACE
        + COMPANY
        + _hash(company_cf)[:62]
    )


def make_product_address(name, company_cf):
    return (
        NAMESPACE
        + PRODUCT
        + _hash(name)[:36]
        + _hash(company_cf)[:26]
    )


def make_batch_address(batch_id, company_cf):
    return (
        NAMESPACE
        + BATCH
        + _hash(batch_id)[:62]
    )

def make_event_company_address(event_id, company_cf):
    return (
        NAMESPACE
        + EVENT_COMPANY
        + _hash(event_id)[:36]
        + _hash(company_cf)[:26]
    )

def make_event_batch_address(event_id, batch_id):
    return (
        NAMESPACE
        + EVENT_BATCH
        + _hash(event_id)[:36]
        + _hash(batch_id)[:26]
    )

def make_proposal_address(batch_id, company_cf, timestamp):
    return (
        NAMESPACE
        + PROPOSAL
        + _hash(batch_id)[:36]
        + _hash(company_cf)[:22]
        + _hash(timestamp)[:4]
    )

def _num_to_page_number(num):
    return hex(num)[2:].zfill(4)

def make_property_address(property_type, batch_id, page=0):
    return (
        make_property_address_range(batch_id, property_type)
        + _num_to_page_number(page)
    )

def make_property_address_range(batch_id, property_type):
    return (
        NAMESPACE
        + PROPERTY
        + _hash(property_type)[:22]
        + _hash(batch_id)[:26]
    )
