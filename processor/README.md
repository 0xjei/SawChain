# AgriChain Transaction Family Specification.
## Overview
The AgriChain transaction family allows supply chain parties to trace products, activities and ownerships as they move through the real world supply chain.
This transaction family implements the full application logic for the food supply chain ecosystem. Due to the nature of the solution and according to the permissioned blockchain platform,
there are different customizable set of types which can be defined to represent your use case.
This application is designed for a *consortium-like* environment, so different decision needs to be made by the different authorized parties. 
To define set of types, issuing credentials to external certification authorities and company administrator, the parties have to decide who will be the system administrator.
To guarantee consistency and filtering over state entity data recording each company will have lists of different types that can be used to create an entity. 
Both authorized and external parties can read information about state recordings, from entities and activities to quantity and ownership movements, 
relying on a unique source of information and application logic.

## State
Each object is structured and serialized using Google Protocol Buffers before being stored in state. 
We have sets of objects that are grouped in different categories:
users (*System Admin*, *Company Admin*, *Operator* and *Certification Authority*), 
types (*TaskType*, *ProductType*, *EventParameterType*, *EventType*), 
companies (*Company*) and optional fields (*Field*), a recorded quantity of product (*Batch*) and activities (*Event*).
As described in the Addressing section below, these objects are stored in separate sub-namespaces under the *AgriChain* namespace.

## Users
There are different possible type of user which can be recorded inside the blockchain, guaranteeing an high degree of 
personalization and responsibility between a cross-organizational environment as the supply chain. 
Each user is identified inside and outside the system uniquely by his/her public key.

### System Admin
The only user enabled to record the different types configuration on-chain and company registration is the System Admin. He is responsible of the issuing of
company administrators and certification authorities credentials. For each AgriChain application there will be only System Admin at a time.
```protobuf
message SystemAdmin {
    // The System Admin's public key.
    string publicKey = 1;
    
    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 2;
}
```

### Company Administrator
##### To do
### Operator
##### To do
### Certification Authority
##### To do

## Types
The different types allows the definition of template-like information to design correctly and customize the entity state recording. 
Each entity is going to be associated with a particular type by a unique-class type string identifier. This mechanism allows an high
degree of customization and a better fault tolerance.
 
#### Task Type
Task type is used to define a particular task/role done by operators inside a company. 
The same task type can be associated to multiple operators during their creation. 
```protobuf
message TaskType {
    // Unique identifier.
    string id = 1;
    // Task name.
    string role = 2;
}
```

### Product Type
Product type is used to define a particular type of product that can be produced, processed and sell along the supply chain.
From a product type can derive multiple products types. Each product type can be associated to multiple batches with
a particular quantity of this product.
```protobuf
message ProductType {
    // Possible different values for unit of measure.
    enum UnitOfMeasure {
        KILOS = 0;
        LITRE = 1;
        METRE = 2;
        UNIT = 3;
    }
    
    // Unique identifier.
    string id = 1;
    // Product name.
    string name = 2;
    // Product description.
    string description = 3;
    // Product unit of measure.
    UnitOfMeasure measure = 4;
    // Unique identifiers of different derived products types.
    repeated string derivedProductsType = 5;
}
```

### Event Parameter Type
Event parameters allows to construct a custom additional information that can be associated to an event filling it with a value.
```protobuf
message EventParameterType {
    // Event Parameter information type.
    enum Type {
        NUMBER = 0;
        STRING = 1;
        BYTES = 2;
        ENUM = 3;
    }
    
    // Unique identifier.
    string id = 1;
    // Event Parameter name.
    string name = 2;
    // Event Parameter type.
    Type type = 3;
}
```

### Event Type
Event types are used to define a particular activity that can be done on a subset of products.
The event can represent an important production, processing or retailing step executed over a certain quantity of product (Batch) by an operator with a specific role.
```protobuf
message EventType {
    // Custom parameter structure used for Event Type.
    message EventParameter {
        // Parameter Type identifier.
        string parameterTypeId = 1;

        // Parameter Properties.
        bool required = 2;
        int32 minValue = 3;
        int32 maxValue = 4;
        int32 minLength = 5;
        int32 maxLength = 6;
    }

    // Unique identifier.
    string id = 1;
    // Event Type name.
    string name = 2;
    // Evnet Type description.
    string description = 3;
    // List of event parameters. 
    repeated EventParameter parameters = 4;
}
```

### Addressing
AgriChain state objects are stored under the namespace obtained by taking the first six characters of the SHA-512 hash of the string *AgriChain* (**f4cb6d**).
The next two characters of an AgriChain object's address are obtained by a string of two numbers different for each entity class:

* Users: **00**
* Types: **01**
* Company: **02**
* Field: **03**
* Batch: **04**
* Event: **05**

For users and types classes there is a second two characters prefix obtained by a string of two numbers different for each possible value of the class:
**Users**
* System Admin: **10**
* Company Admin: **11**
* Operator: **12**
* Certification Authority: **13**
**Types**
* Task Type: **20**
* Product Type: **21**
* Event Type: **22**
* Event Parameter Type: **23**

The remaining characters of an object's address (60 characters for Users and Types objects and 62 for different entities), are determined as follows:
* System Admin: a string of 60 characters of zeros (this address is unique).
* Company Admin:  *todo*
* Operator:  *todo*
* Certification Authority:  *todo*
* Task Type: the first 62 characters of the hash of its identifier.
* Product Type: the first 62 characters of the hash of its identifier.
* Event Type: the first 62 characters of the hash of its identifier.
* Event Parameter Type: the first 62 characters of the hash of its identifier.
* Company: *todo*
* Field: *todo*
* Batch: *todo*
* Event: *todo*

## Transactions
### Transaction Payload
All AgriChain transactions are wrapped in a tagged payload object to allow the transaction dispatching to the appropriate handling logic.
```protobuf
message ACPayload {
    enum Action {
        CREATE_SYSADMIN = 0;
        UPDATE_SYSADMIN = 1;
        CREATE_TASK_TYPE = 2;
        CREATE_PRODUCT_TYPE = 3;
        CREATE_EVENT_PARAMETER_TYPE = 4;
        CREATE_EVENT_TYPE = 5;
    }

    Action action = 1;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 2;

    UpdateSystemAdminAction updateSysAdmin = 3;
    CreateTaskTypeAction createTaskType = 4;
    CreateProductTypeAction createProductType = 5;
    CreateEventParameterType createEventParameterType = 6;
    CreateEventType createEventType = 7;
}
```
Any transaction is invalid if its timestamp is greater than the validator's system time.

### Create System Admin
Records the System Admin state object. The signer_public_key in the transaction header is used as the System Admin's public key.
A Create System Admin transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* System Admin is already recorded.
* The public key field is already associated to a different recorded user.

### Update System Admin
Update the System Admin state object with a new public key reference. The new System Admin must be different to the previous one.
```protobuf
message UpdateSystemAdminAction {
    // New System Admin's public key.
    string publicKey = 1;
}
```
An Update System Admin transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Public key field is not set.
* Public key field doesn't contain a valid public key.
* No System Admin is previously recorded.
* The public key field contains the current System Admin public key.
* The public key field is already associated to a different recorded user.
* Transaction signer is different from the previous System Admin.

### Create Task Type
Record a new user-defined Task Type giving the identifier and the particular task/role. 
```protobuf
message CreateTaskTypeAction {
    // Unique identifier.
    string id = 1;
    // Role name.
    string role = 2;
}
```
A Create Task Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Role is not set.
* Transaction signer is different from the current System Admin.
* Identifier is already associated to a different Task Type.

### Create Product Type
Record a new user-defined Product Type which has an identifier, a product name and description. 
One of the possible quantity measures must be chosen. An optional derived products list can be specified.
```protobuf
message CreateProductTypeAction {
    string id = 1;
    string name = 2;
    string description = 3;
    ProductType.UnitOfMeasure measure = 4;
    repeated string derivedProductsType = 5;
}
```
A Create Product Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Name is not set.
* Description is not set.
* Unit of measure is different from one of the possible values.
* Transaction signer is different from the current System Admin.
* Identifier is already associated to a different Product Type.
* Derived products type field contains Product Type that are not recorded yet.

### Create Event Parameter Type
Record a new user-defined Event Parameter Type which has an identifier and a name. One of the possible types must be chosen.
```protobuf
message CreateEventParameterType {
    string id = 1;
    string name = 2;
    EventParameterType.Type type = 3;
}
```
A Create Event Parameter Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Name is not set.
* Type is different from one of the possible values.
* Transaction signer is different from the current System Admin.
* Identifier is already associated to a different Event Parameter Type.

### Create Event Type
Record a new user-defined Event Type each of which has an identifier, a name, a description and a list of Event Parameters. 
```protobuf
message CreateEventType {
    string id = 1;
    string name = 2;
    string description = 3;
    repeated EventType.EventParameter parameters = 4;
}
```
A Create Event Type transaction is invalid if one of the following conditions occurs:
* Timestamp not set.
* Identifier is not set.
* Name is not set.
* Description is not set.
* Transaction signer is different from the current System Admin.
* Identifier is already associated to a different Event Type.
* Event parameters type field contains a Event Parameter Type that are not recorded yet.
