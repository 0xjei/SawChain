# SawChain Transaction Family Specification
## Overview
The SawChain Transaction Family allows each member of a supply-chain consortium to rely on a predefined set of immutable transaction actions 
for updating a single shared ledger. The external agreements as well as users, products and events are managed through a user-specifiable set of types which are adaptable to every use case.
Any individual is able to read data from the state of the ledger to reconstruct the history of events that occurs on production batches, ownership changes and quantity shifts.

*nb.* The project is under development and this specification file must **NOT** be considered as definitive.

## Contents
- [State](#state)
    * [Users](#users)
        * [System Admin](#system-admin)
        * [Company Admin](#company-admin)
        * [Operator](#operator)
    * [Types](#types)
        * [Task Type](#task-type)
        * [Product Type](#product-type)
        * [Event Parameter Type](#event-parameter-type)
        * [Event Type](#event-type)
    * [Entities](#entities)
        * [Company](#company)
        * [Field](#field)
- [Addressing](#addressing)
- [Transactions](#transactions)
    * [Transaction Payload](#transaction-payload)
    * [Create System Admin](#create-system-admin)
    * [Update System Admin](#update-system-admin)
    * [Create Task Type](#create-task-type)
    * [Create Product Type](#create-product-type)
    * [Create Event Parameter Type](#create-event-parameter-type)
    * [Create Event Type](#create-event-type)
    * [Create Company](#create-company)
    * [Create Field](#create-field)
    * [Create Operator](#create-operator)
    * [Create Description Event](#create-description-event)
    
## State
Each object is serialized using [Google Protocol Buffers](https://developers.google.com/protocol-buffers/) before being stored in state. 
Protocol Buffers are language-neutral, platform-neutral, extensible mechanism for serializing structured data.
To improve the understanding of the relationships between state objects they have been grouped as follows:
- **Users**: *System Admin*, *Company Admin*, *Operator*, and *Certification Authority*.
- **Types**: *Task Type*, *Product Type*, *Event Parameter Type*, *Event Type*, and *Property Type*.
- **Entities**: *Company*, *Field*, *Event* and *Batch* .

As described in the [Addressing](#addressing) section below, these objects are stored in separate sub-namespaces under the SawChain namespace.

### Users
Every user is an authorized *agent* able to send transactions to the ledger. 
This could include not only humans, but also autonomous sensors or other IoT devices. 
Each user is uniquely identified by his/her own public key and it must be created (recorded on-chain) in order to be authorized to send transactions.

#### System Admin
The System Admin is a special kind of user who is external and unique among supply-chain participants, but identified as trustworthy by themselves.
He is responsible for system startup which concerns the recording of companies as well as their administrators, the entire set of types according to supply-chain rules and agreements. 
By the external nature of the System Admin, is possible to avoid tampering and mitigate corporate terrorism between participants.

```protobuf
message SystemAdmin {
    // The System Admin's public key.
    string publicKey = 1;

    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 2;
}
```

### Company Admin
Each company is managed by a Company Administrator who is enabled to issue credentials and
assign tasks to Operators. If the company covers the primary production phase, the Company Administrator can also record the company production fields.

```protobuf
message CompanyAdmin {
    string publicKey = 1;

    // Company identifier.
    string company = 2;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 3;
}
```

### Operator
An Operator is an authorized user enabled to record data about production batches and events which happened within the company who works for.
The task field allows dynamic filtering during registration of data which decreases occurrences of errors.

```protobuf
message Operator {
    string publicKey = 1;

    // Company identifier.
    string company = 2;

    // Assigned task into the company.
    string task = 3;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 4;
}
```

### Certification Authority
A Certification Authority represent a real-world external authority who verifies production batches qualities, product and status along the supply-chain.
Each authority is represented with a unique public key, a name and website reference and a list of products where can certify their analysis.
They can work over each production batch of every company because they are recognized as verification entity by the entire consortium.

```protobuf
message CertificationAuthority {
    // The CertificationAuthority's public key.
    string publicKey = 1;

    // The CertificationAuthority name.
    string name = 2;

    // The CertificationAuthority website.
    string website = 3;

    // List of enabled Product Types for certification.
    repeated string products = 4;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 5;
}
```

## Types
Each Type is a template structure which users can defined to match their design.
In order to validate incoming data, each entity (like events, batches, etc.) is assigned to a particular Type at creation. 
Types are recorded into the state to avoid subsequent changes or misunderstandings between parties.  
As the supply chain needs to evolve, different Types can be recorded into the state.
 
#### Task Type
Operators are bound to a specified role inside a company which describes their responsibilities. 
This information can be used to filter different types of products and events that the operator can interact. 
Task type is used to define a particular task/role for operators. 

```protobuf
message TaskType {
    // Unique identifier.
    string id = 1;

    // Task name.
    string role = 2;
}
```

### Product Type
A food supply-chain moves tons of production batches from production to retailing steps. The production companies are well-known and
every product needs to be monitored as well as each possible derived product from it.
Every product that can be produced, processed and sell along the supply chain is recorded as Product Type.
This is so important to notice that SawChain tracks units of amount of products (i.e. production batch) and can be configured to track
single production units, but it's not the point.
The conversion rate for each derived product enable the recording of real quantity changes.

```protobuf
message ProductType {
    message DerivedProduct {
        // Derived Product Type identifier.
        string derivedProductType = 1;

        // Quantity conversion rate.
        float conversionRate = 2;
    }

    // Possible values for unit of measure.
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

    // Product quantity unit of measure.
    UnitOfMeasure measure = 4;

    // List of derived products.
    repeated DerivedProduct derivedProducts = 5;
}
```

### Event Parameter Type
Due to the variety of supply-chain relevant events, it's not possible to figure out which information should be added in general.
For this purpose, Event Parameter Type allows to construct a custom piece of additional information that is used to make up an Event Type.

```protobuf
message EventParameterType {
    // Event Parameter values for type.
    enum Type {
        NUMBER = 0;
        STRING = 1;
        BYTES = 2;
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
An Event Type represent an important production, processing or retailing activity performed on a field or production batch.
The same event can be recorded in different kind of products from operators assigned to different tasks.

Relevant events are made up through a list of previously defined Event Parameters Types.
Each parameter can be enriched with some fields depends on his type (required, min/max value and length) that needs to be satisfied to record it correctly.
For example, a parameter *Notes* can have a *required* property set to *true* and a *maxLength* property set to *80*.
A value must not be assigned to 'values' fields, it's going to be assigned during Event recording step.
Exclusively only one values field will be validated based on parameter type.
As in the previous example, *Notes* must have the *stringValue* field filled with a string having a number of characters greater than 0 and less than 80.

The *typology* field is used to separate Event Types that deals with transformations of products and his quantities (TRANSFORMATION) to ones that provides
information and data about an activity (DESCRIPTION). If the Event Type deals with transformations, the *derivedProductTypes* field must be filled in.

```protobuf
message EventType {
    // Different typology of events.
    enum EventTypology {
        DESCRIPTION = 0; // Information only.
        TRANSFORMATION = 1; // Quantity and product changes.
    }

    // Event Parameter structure.
    message EventParameter {
        // Parameter Type identifier.
        string parameterTypeId = 1;

        // Parameter Properties.
        bool required = 2;
        int32 minValue = 3;
        int32 maxValue = 4;
        int32 minLength = 5;
        int32 maxLength = 6;

        // Values fields. Only one of these fields should be used,
        // and it should match the type specified Type in EventParameterType.
        float floatValue = 7;
        string stringValue = 8;
        bytes bytesValue = 9;
    }

    // Unique identifier.
    string id = 1;

    // Event typology.
    EventTypology typology = 2;

    // Event name.
    string name = 3;

    // Event description.
    string description = 4;

    // List of Event Parameters.
    repeated EventParameter parameters = 5;

    // List of Task Type identifiers.
    repeated string enabledTaskTypes = 6;

    // List of Product Type identifiers.
    repeated string enabledProductTypes = 7;

    // List of Derived Product Type identifiers (for TRANSFORMATION typology only).
    repeated string derivedProductTypes = 8;
}
```

## Entities
### Company
Along the entire supply-chain, different companies compete to decrease costs and to maximize earnings.
Consequently, it's obvious that every company needs information integrity and reliability from untrusted parties without revealing any secret.
A Company is uniquely identified by the hash of the first 10 characters of the public key of its Company Admin.
To avoid single point of failure, every Company has a list of authorized Operators.
The Operators can create batches for the Company and record events on them.
To improve traceability, each production Company has an additional list of his production Fields.

```protobuf
message Company {
    // Company unique identifier (First 10 characters of sha512 of adminPublicKey).
    string id = 1;

    // Company name.
    string name = 2;

    // Company description.
    string description = 3;

    // Company website.
    string website = 4;

    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 5;

    // Company Admin public key.
    string adminPublicKey = 6;

    // List of Company Fields (only for production companies).
    repeated string fields = 7;

    // List of Company Operators.
    repeated string operators = 8;

    // List of Company Batches.
    repeated string batches = 9;
}
```

### Field
The primary production phase is the most sensible to introduction of un-tracked materials and products.
It's impossible to avoid the totality of the problems, but it's possible to mitigate them. Using a prediction of the production quantity of a field,
it's possible to limit the creation of production batches, mitigating the introduction of un-tracked products because their quantity it's not related to the field. 
The list of recorded Events related to the Field, are stored inside the Field state object itself.

```protobuf
message Field {
    // Field identifier.
    string id = 1;

    // Field description.
    string description = 2;

    // Owner Company identifier.
    string company = 3;

    // Cultivated Product Type.
    string product = 4;

    // Predicted production quantity.
    float quantity = 5;

    // Location coordinates.
    Location location = 6;

    // List of recorded Events.
    repeated Event events = 7;
}
```

### Event
Different activities and transformations of production batches can be made during the supply-chain phases. The Event state object
represent the unique source of information about these activities executed over fields and batches.
Each Event refers to a recorded EventType to get the information about parameters, list for filtering purposes and typology, avoiding saving redundant data.
Only the Operators can record an Event over fields e/o batches for the company for which they are authorized.
If the given EventType identifier refers to an EventType that has a parameter list with at least one required parameter, a list of ParameterValue must be provided.
For transformation typology events, the quantity used for the transformation activity must be provided and stored in the Event itself.

```protobuf
message Event {
    // Event Parameter value.
    message EventParameterValue {
        // Event Parameter identifier.
        string parameterTypeId = 1;

        // Values fields. Only one of these fields should be used,
        // and it should match the type specified Type in EventParameterType.
        float floatValue = 2;
        string stringValue = 3;
        bytes bytesValue = 4;
    }

    // Event Type identifier.
    string eventTypeId = 1;

    // Public key of the transaction sender (Operator).
    string reporter = 2;

    // Unique identifiers of different EventParameterValues.
    repeated EventParameterValue values = 3;

    // Used transformation quantity.
    float quantity = 4;

    uint64 timestamp = 5;
}
```

### Batch
A production Batch represent an identified quantity of a certain product which is produced, processed, stored and moved along the supply-chain by a Company.
A Batch is uniquely identified by a specific identifier inside the production Company. The quantity represents the unit, kilos or litre of product that are contained inside the Batch.
The parent references is used to backtracking the history of the Batch, passing through its events and those of the parents.
A Certification Authority can issue a certificate on a particular date, specifying links and hashes of the external document.
The boolean value is used to end the possibility of Event recording over the Batch.

```protobuf
message Batch {
    // Certificate issued by a recorded Certification Authority.
    message Certificate {
        // Certification Authority public key.
        string authority = 1;

        // Certificate external link.
        string link = 2;

        // Certificate file hash.
        string hash = 3;

        // Date and time when certificate is issued.
        uint64 timestamp = 4;
    }

    // Batch unique identifier.
    string id = 1;

    // Product Type identifier.
    string product = 2;

    // Batch quantity.
    float quantity = 3;

    // List of parent fields where Batch is transformed.
    repeated string parentFields = 4;

    // List of parent batches where Batch is transformed.
    repeated string parentBatches = 5;

    // List of recorded Events.
    repeated Event events = 6;

    // Batch certification.
    Certificate certificate = 7;

    // A binary value to check if the Batch is currently active (not sold, withdrawn, etc.).
    bool finalized = 8;

    uint64 timestamp = 9;
}
```

## Addressing
SawChain state objects are stored under the namespace obtained by taking the first six characters of the SHA-512 hash of the string SawChain (**87f67d**).
The addressing flexibility in Sawtooth allows to create an addressing scheme to organize the hexadecimal characters after the namespace.
This is useful to make a pure scheme to retrieve information stored in the state (check [Sawtooth Addressing](https://sawtooth.hyperledger.org/docs/core/releases/latest/app_developers_guide/address_and_namespace.html?highlight=addressing) for more info.

The SawChain addressing scheme uses the next two hexadecimal characters after the namespace to group together addresses containing records with the same structure.

* Users: `00`
* Types: `01`
* Company: `02`
* Field: `03`
* Batch: `04`
* Event: `05`

The next hexadecimal characters are organized based on which type of record is going to be stored in the state.
The remaining 62 characters of state addresses are determined as below:

* System Admin
    - The two hexadecimal characters `10`,
    - 60 zeros.
* Company Admin
    - The two hexadecimal characters `11`,
    - The first 60 characters of the SHA-512 of its public key.
* Operator
    - The two hexadecimal characters `12`,
    - The first 60 characters of the SHA-512 of its public key.
* Certification Authority
    - The two hexadecimal characters `13`,
    - The first 60 characters of the SHA-512 of its public key.

* Task Type
    - The two hexadecimal characters `20`,
    - The first 60 characters of the SHA-512 of its identifier.
* Product Type
    - The two hexadecimal characters `21`,
    - The first 60 characters of the SHA-512 of its identifier.
* Event Parameter Type
    - The two hexadecimal characters `22`,
    - The first 60 characters of the SHA-512 of its identifier.
* Event Type
    - The two hexadecimal characters `23`,
    - The first 60 characters of the SHA-512 of its identifier.
* Property Type
    - The two hexadecimal characters `24`,
    - The first 60 characters of the SHA-512 of its identifier.

* Company
    - The two hexadecimal characters `02`,
    - The first 62 characters of the SHA-512 of its identifier.
* Field
    - The two hexadecimal characters `03`,
    - The first 42 characters of the SHA-512 of its identifier.
    - The first 20 characters of the SHA-512 of its company identifier.
* Batch
    - The two hexadecimal characters `04`,
    - The first 62 characters of the SHA-512 of its identifier.

## Transactions
### Transaction Payload
All SawChain transactions are wrapped in a tagged payload object to allow the transaction dispatching to the appropriate action handling logic.

```protobuf
message SCPayload {
    enum Action {
        CREATE_SYSTEM_ADMIN = 0;
        UPDATE_SYSTEM_ADMIN = 1;
        CREATE_TASK_TYPE = 2;
        CREATE_PRODUCT_TYPE = 3;
        CREATE_EVENT_PARAMETER_TYPE = 4;
        CREATE_EVENT_TYPE = 5;
        CREATE_PROPERTY_TYPE = 6;
        CREATE_CERTIFICATION_AUTHORITY = 7;
        CREATE_COMPANY = 8;
        CREATE_FIELD = 9;
        CREATE_OPERATOR = 10;
        CREATE_DESCRIPTION_EVENT = 11;
        CREATE_TRANSFORMATION_EVENT = 12;
        ADD_BATCH_CERTIFICATE = 13;
        RECORD_BATCH_PROPERTY = 14;
        CREATE_PROPOSAL = 15;
        ANSWER_PROPOSAL = 16;
        FINALIZE_BATCH = 17;
    }

    Action action = 1;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 2;

    UpdateSystemAdminAction updateSystemAdmin = 3;
    CreateTaskTypeAction createTaskType = 4;
    CreateProductTypeAction createProductType = 5;
    CreateEventParameterTypeAction createEventParameterType = 6;
    CreateEventTypeAction createEventType = 7;
    CreatePropertyTypeAction createPropertyType = 8;
    CreateCertificationAuthorityAction createCertificationAuthority = 9;
    CreateCompanyAction createCompany = 10;
    CreateFieldAction createField = 11;
    CreateOperatorAction createOperator = 12;
    CreateDescriptionEventAction createDescriptionEvent = 13;
    CreateTransformationEventAction createTransformationEvent = 14;
    AddBatchCertificateAction addBatchCertificate = 15;
    RecordBatchPropertyAction recordBatchProperty = 16;
    CreateProposalAction createProposal = 17;
    AnswerProposalAction answerProposal = 18;
    FinalizeBatchAction finalizeBatch = 19;
}
```

Any transaction is invalid if its timestamp is greater than the validator's system time or correspondent action field is not provided.

### Create System Admin
Records the System Admin into the state. The `signer_pubkey` in the transaction header is used as the System Admin's public key.

A Create System Admin transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* System Admin is already recorded.

### Update System Admin
The System Admin can be replaced by changing the public key recorded into the unique state address for System Admin.
The only user enabled to perform this action is the current System Admin.

```protobuf
message UpdateSystemAdminAction {
    // The new System Admin public key.
    string publicKey = 1;
}
```

An Update System Admin transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* The public key field doesn't contain a valid public key.
* The signer is not the System Admin.
* The public key belongs to another authorized user.

### Create Task Type
When the System Admin creates a Task Type he has to specify a unique identifier among these types and a string which describes the role.

```protobuf
message CreateTaskTypeAction {
    // Task Type unique identifier.
    string id = 1;

    // Task name.
    string role = 2;
}
```

A Create Task Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Role is not set.
* Transaction signer is not the System Admin.
* There is a Task Type already associated to given id.

### Create Product Type
To create a Product Type, the System Admin needs to provide a unique identifier and some products information, such as name, description and unit of measure.
If there are types of products that are derivable through a transformation event from it, then id and conversion rate from new quantity must be specified.

```protobuf
message CreateProductTypeAction {
    // Product Type unique identifier.
    string id = 1;

    // Product Type name.
    string name = 2;

    // Product Type description.
    string description = 3;

    // Product Type unit of measure.
    ProductType.UnitOfMeasure measure = 4;

    // List of derived product types.
    repeated ProductType.DerivedProduct derivedProducts = 5;
}
```
None of the provided PropertyValues match the types specified in the Record's RecordType.

A Create Product Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Name is not set.
* Description is not set.
* Provided value for unit of measure doesn't match the types specified in the ProductType's UnitOfMeasure.
* Transaction signer is not the System Admin.
* There is a Product Type already associated to given id.
* At least one of the provided values for derivedProductTypes doesn't match a valid Product Type.

### Create Event Parameter Type
When the System Admin creates a Event Parameter Type he has to specify a unique identifier among these types, a name and a correct information type.

```protobuf
message CreateEventParameterTypeAction {
    // Event Parameter Type unique identifier.
    string id = 1;

    // Event Parameter Type name.
    string name = 2;

    // Event Parameter Type information type.
    EventParameterType.Type type = 3;
}
```
A Create Event Parameter Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Name is not set.
* Provided value for type doesn't match the types specified in the EventParameter's EventParameterType.
* Transaction signer is not the System Admin.
* There is an Event Parameter Type already associated to given id.

### Create Event Type
To create a Event Type, the System Admin needs to provide a unique identifier, the typology, a name and description.
The list of event parameters can be specified to customize the information requirements that needs to be provided for recording the event into the state.
To decide who can record and where can be recorded an event with a specific type, the Task Types and Product Types lists must be specified.
If the typology indicates there's an activity that involves product transformation, a list of types of products that are derivable through a transformation event from it must be specified.

```protobuf
message CreateEventTypeAction {
    // Event Type unique identifier.
    string id = 1;

    // Event Type typology (description/transformation).
    EventType.EventTypology typology = 2;

    // Event Type name.
    string name = 3;

    // Event Type description.
    string description = 4;

    // List of EventParameters.
    repeated EventType.EventParameter parameters = 5;
    
    // List of authorized Task Types.
    repeated string enabledTaskTypes = 6;

    // List of enabled Product Types.
    repeated string enabledProductTypes = 7;

    // List of derived Product Types (for transformations typology only)
    repeated string derivedProductTypes = 8;
}
```

A Create Event Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Identifier is not set.
* Provided value for typology doesn't match the types specified in the EventType's EventTypology.
* Name is not set.
* Description is not set.
* Transaction signer is not the System Admin.
* There is an Event Type already associated to given id.
* At least one of the provided Event Parameter Types values for parameters doesn't match a valid Event Parameter Type.
* At least one of the provided Task Types values for enable task types doesn't match a valid Task Type.
* At least one of the provided Product Types values for enable product types doesn't match a valid Product Type.
* No derived products for transformation event typology.
* Derived products are given for description event.
* At least one of the provided Product Types values for derived product types doesn't match a valid Product Type.
* At least one of the provided Product Types values for derived product types doesn't match with one of those enabled for the Product Type.

### Create Certification Authority
The System Admin can create a Certification Authority enabled to record certificates over every Company batch. 
The System Admin needs to specify the Certification Authority public key, the name and website reference, and the list of products who can certify. 
The transaction creates a new Certification Authority into the state.

```protobuf
message CreateCertificationAuthorityAction {
    // CertificationAuthority public key.
    string publicKey = 1;

    // CertificationAuthority name.
    string name = 2;

    // CertificationAuthority website.
    string website = 3;

    // List of enabled Product Types for certification.
    repeated string products = 4;
}
```

A Create Certification Authority transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Public key is not set.
* Name is not set.
* Website is not set.
* Products is not set.
* Public key field doesn't contain a valid public key.
* The System Admin is not recorded.
* There is a user already associated to given public key.
* Transaction signer is not the System Admin.
* At least one of the provided Product Type values for products doesn't match a valid Product Type.

### Create Company
To create a Company, the System Admin needs to provide some information: a name, a description, a website reference and the public key of the Company Admin.
The identifier of the Company is derived from the public key of the Company Admin.
This transaction record a new Company and a new Company Admin into the state.

```protobuf
message CreateCompanyAction {
    // Company name.
    string name = 1;

    // Company description.
    string description = 2;

    // Company website.
    string website = 3;

    // Company Admin public key.
    string admin = 4;
}
```

A Create Company transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Name is not set.
* Description is not set.
* Website is not set.
* Admin public key is not set.
* Admin public key doesn't contain a valid public key.
* Transaction signer is not the System Admin.
* There is already a user with the admin's public key.

### Create Field
A Field can be created by a Company Admin associated to a Company recorded into the state.
The Company Admin needs to specify the unique identifier, a description, the cultivated product, the predicted production quantity and the approximation of Field's location.

```protobuf
message CreateFieldAction {
    // Field unique identifier.
    string id = 1;

    // Field description.
    string description = 2;

    // Field cultivated product.
    string product = 3;

    // Field predicted production quantity.
    float quantity = 4;

    // Field location.
    Location location = 5;
}
```

A Create Field transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Id is not set.
* Description is not set.
* Product is not set.
* Location is not set.
* Transaction signer is not a Company Admin or doesn't have a Company associated to his public key.
* There is already a Field with the provided id into the Company.
* The provided Product Type value for product doesn't match a valid Product Type.
* Quantity is lower than or equal to zero.

## Create Operator
A Company Admin can create an Operator enabled to record production batches and events for his Company. 
The Company Admin needs to specify the Operator public key and the Task Type associated to his role inside the Company. 
The transaction creates a new Operator into the state and updates Company Admin's Company operators list.

```protobuf
message CreateOperatorAction {
    // Operator public key.
    string publicKey = 1;

    // Operator task.
    string task = 2;
}
```

A Create Operator transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Public key is not set.
* Task is not set.
* Public key doesn't contain a valid public key.
* Transaction signer is not a Company Admin or doesn't have a Company associated to his public key.
* There is already a user with the operator's public key.
* The provided Task Type value for task doesn't match a valid Task Type.

## Create Description Event
Currently, it's possible to define and record the configuration of the supply-chain and its participants into the state. 
These records are the building blocks to deal with the main challenge which is the ability to record data about production entities,
respecting the constraints imposed on quantities, event parameters, tasks, products, etc.
Along the supply-chain different fundamentals activities are executed on the production fields and batches.
A description Event allow a Company Operator to record and certify information data of the activities performed on a Field or Batch held by a Company into the state.
This type of Event does not deal with the quantity of a Field or a Batch.
The Operator must specify an EventType identifier, one Batch or Field where to record the Event and an optional list of EventParameterValue.
The EventType identifier is used to retrieve the information about the EventType to validate the input data.
The transaction creates a new description Event updating the Event list for the provided input Field or the Batch.
The Event is stored inside the Batch or Field itself because each Event belongs uniquely to a Batch or Field which simplify the backtracking process.

```protobuf
message CreateDescriptionEvent {
    // Event Type identifier.
    string eventTypeId = 1;

    // Company Batch for event recording.
    string batch = 2;

    // Company Field for event recording.
    string field = 3;

    // Unique identifiers and values of necessary EventParameterValues.
    repeated Event.EventParameterValue values = 4;
}
```

A Create Description Event transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Event Type identifier is not set.
* Batch or Field is not set.
* Transaction signer is not an Operator for a Company.
* Provided value for field does not match with a Company Field.
* Provided value for batch does not match with a Company Batch.
* Provided value for eventTypeId does not match with a valid Event Type.
* Provided Event Type doesn't match a valid description Event Type.
* Operator's task doesn't match one of the enabled Task Types for the Event Type.
* Field Product Type doesn't match one of the enabled Product Types for the Event Type.
* Batch Product Type doesn't match one of the enabled Product Types for the Event Type.
* No values are provided for required Event Parameters.
* No correct value field is provided for required parameter of type number.
* The provided number is lower than the minimum value constraint.
* The provided number is greater than the maximum value constraint.
* No correct value field is provided for required parameter of type string.
* The provided string length is lower than the minimum length constraint.
* The provided string length is greater than the maximum length constraint.
* No correct value field is provided for required parameter of type bytes.

## Create Transformation Event
Production batches represent a quantity of a certain product which is produced, processed, stored and moved along the supply-chain.
To avoid the creation of these batches from scratch it's used a transformation-events mechanism.
A transformation Event allow a Company Operator to create and certify a production Batch for its company using Company Fields or Batches.
The Operator must specify an EventType identifier, a list of input Batches or Fields, a list of product quantities to subtract from input resources (Batches/Fields) 
the output product and a unique output Batch identifier.
This type of Event deals with the quantity of the input Fields or Batches and doesn't need any parameter value. 
The output Batch quantity will be converted using the correspondent conversion rate based on the given output product type and the input product type of Fields and Batches.
The EventType identifier is used to retrieve the information about the EventType to validate the input data.
The transaction creates a new transformation Event updating the Event list for each Field or Batch provided in input.
The Event is stored inside each input Batch or Field itself because each Event belongs uniquely to a Batch or Field which simplify the backtracking process.

```protobuf
message CreateTransformationEvent {
    // Event Type identifier.
    string eventTypeId = 1;

    // A list of Company Batches to transform.
    repeated string batches = 2;

    // A list of Company Fields to transform.
    repeated string fields = 3;

    // An ordered list of quantities to subtract from input resources (Batch/Field).
    repeated float quantities = 4;

    // Output Batch Product Type.
    string derivedProduct = 5;

    // Output Batch identifier.
    string outputBatchId = 6;
}
```

A Create Transformation Event transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* Event Type identifier is not set.
* A list of Batch or a list of Field is not set.
* A list of quantities not set.
* Derived product is not set.
* Output Batch identifier is not set.
* Transaction signer is not an Operator for a Company.
* Provided value for eventTypeId does not match with a valid Event Type.
* At least one of the provided values for fields doesn't match a Company Field.
* At least one of the provided values for batches doesn't match a Company Batch.
* Provided Event Type doesn't match a valid transformation Event Type.
* Operator's task doesn't match one of the enabled Task Types for the Event Type.
* At least a provided field doesn't match other Field's Product Type.
* At least a provided batch doesn't match other Batch's Product Type.
* Field Product Type doesn't match one of the enabled Product Types for the Event Type.
* Batch Product Type doesn't match one of the enabled Product Types for the Event Type.
* Derived product doesn't match one of the derived Product Types for the Event Type.
* At least one of the given quantities is less or equal to zero.
* The quantity to be subtracted cannot be greater than the current quantity of the Batch or Field.
* The provided output batch identifier is already used for another Company Batch.
