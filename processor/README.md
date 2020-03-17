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
        * [Certification Authority](#certification-authority)
    * [Types](#types)
        * [Task Type](#task-type)
        * [Product Type](#product-type)
        * [Event Parameter Type](#event-parameter-type)
        * [Event Type](#event-type)
        * [Property Type](#property-type)
    * [Entities](#entities)
        * [Company](#company)
        * [Field](#field)
        * [Event](#event)
        * [Batch](#batch)
- [Addressing](#addressing)
- [Transactions](#transactions)
    * [Transaction Payload](#transaction-payload)
    * [Create System Admin](#create-system-admin)
    * [Update System Admin](#update-system-admin)
    * [Create Task Type](#create-task-type)
    * [Create Product Type](#create-product-type)
    * [Create Event Parameter Type](#create-event-parameter-type)
    * [Create Event Type](#create-event-type)
    * [Create Property Type](#create-property-type)
    * [Create Certification Authority](#create-certification-authority)
    * [Create Company](#create-company)
    * [Create Field](#create-field)
    * [Create Operator](#create-operator)
    * [Create Description Event](#create-description-event)
    * [Create Trasformation Event](#create-transformation-event)
    * [Add Batch Certificate](#add-batch-certificate)
    
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
Each Company is managed by a Company Admin who is enabled to issue credentials and tasks to Operators who work inside the Company itself. 
If a Company is a primary production Company, then his admin can record a list of production Fields.
The Company Admin is created at the time of creation of the Company.

```protobuf
message CompanyAdmin {
    // The Company Admin's public key.
    string publicKey = 1;

    // The Company address.
    string company = 2;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 3;
}
```

### Operator
An Operator is an authorized user enabled to record events which happened in the Company who works for.
An Operator is authorized to deal with a subset of products and events based on his/her task. 

```protobuf
message Operator {
    // The Operator's public key.
    string publicKey = 1;

    // The Company state address.
    string company = 2;

    // The assigned Task Type address.
    string task = 3;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 4;
}
```

### Certification Authority
A Certification Authority represent a real-world external authority who certify the quality of production batches along the supply chain.
Each one is represented with a unique public key, a name and website reference.
The list of Product Types is used to identify a particular type of product that can be certified.
They can certify each production batch of every company because they are recognized as authority by the consortium of participants.

```protobuf
message CertificationAuthority {
    // The Certification Authority public key.
    string publicKey = 1;

    // The Certification Authority name.
    string name = 2;

    // The Certification Authority website.
    string website = 3;

    // A list of enabled Product Types addresses where recording the certificate.
    repeated string enabledProductTypes = 4;

    // Approximately when transaction was submitted, as a Unix UTC timestamp
    uint64 timestamp = 5;
}
```

## Types
Due to the variety of food supply chains the identification of building blocks for designing a generic food chain seems very difficult. 
Types are template forms which guarantee adaptability to a wide range of use cases. They will be used to define a particular type of state object involved in the supply chain.
The System Admin will configure and record each possible Type into the state according to the consortium specifications.
This mechanism leads to an extensible on-chain configuration which avoids subsequent changes or misunderstandings between parties.

#### Task Type
A Task Type describes a particular task that can be assigned to an Operator inside a Company.
An Operator is authorized to deal with a subset of products and events based on his/her task. 

```protobuf
message TaskType {
    // The Task Type unique identifier.
    string id = 1;

    // The name of the task.
    string task = 2;
}
```

### Product Type
Along a food supply-chain tons of different quantities of products are moved every day.
Each company has its own particular working process that involves only particular products.
A Product Type is used to identify a particular type of product that can be produced, processed and sell along the supply chain.
Multiple product types can derive from one type of product, each of which has its own quantity conversion rate, 
which varies from production process to product quality.

```protobuf
message ProductType {
    message DerivedProductType {
        // The derived Product Type state address.
        string productTypeAddress = 1;

        // A multiplier value for the quantity conversion rate.
        float conversionRate = 2;
    }

    // The Product Type unique identifier.
    string id = 1;

    // The product name.
    string name = 2;

    // A short description of the product.
    string description = 3;

    // The unit of measure used for the product quantity.
    TypeData.UnitOfMeasure measure = 4;

    // A list of derived Product Types with a quantity conversion rate.
    repeated DerivedProductType derivedProductTypes = 5;
}
```

### Event Parameter Type
Even the same events may require different information based on the production process adopted by the company or the products involved.
Due to the variety of supply-chain relevant events it's not possible to guess which information must be associated to the event.
The Event Parameter Type allows to create a custom type of template information (named parameter) which can be attached 
to a multiple Event Type with additional features (ex. required, min/max values/length).

```protobuf
message EventParameterType {
    // The Event Parameter Type unique identifier.
    string id = 1;

    // The Event Parameter Type name.
    string name = 2;

    // The Event Parameter Type information data type.
    TypeData.DataType type = 3;
}
```

### Event Type
An Event Type represent an important production, processing or retailing activity performed on a production entity (Field/Batch).
An Event Type is constructed using a list of previously defined Event Parameter Types.

A Parameter can have different additional features (required, min/max value/length) to satisfy in order to record the Event correctly.
For example, a parameter *Notes* can have a *required* property set to *true* and a *maxLength* property set to *80*.
A value can be assigned to one of the 'values' fields (according to parameter DataType) only if it's a default value,
otherwise, the Operator will provide a value during Event recording.
For example, *Notes* must have the field *stringValue* filled with a string containing up to 80 characters.

The *typology* field is used to separate description and transformation Event Types.
The first typology provides custom parameters to fill in with information and data about a real activity, and the second one deals with transformations of products (ie. quantities manipulation).
In the latter case it is necessary to provide a list of enabled derived Product Types.

```protobuf
message EventType {
    enum Typology {
        // Deal with information.
        DESCRIPTION = 0;
        // Deal with quantities.
        TRANSFORMATION = 1;
    }

    message Parameter {
        // The Event Parameter Type state address.
        string eventParameterTypeAddress = 1;

        // The Event Parameter additional features.
        bool required = 2;
        int32 minValue = 3;
        int32 maxValue = 4;
        int32 minLength = 5;
        int32 maxLength = 6;
    }

    // The Event Type unique identifier.
    string id = 1;

    // The Event Type typology.
    Typology typology = 2;

    // The Event Type name.
    string name = 3;

    // A short description of the event.
    string description = 4;

    // A list of Event Parameters with additional features.
    repeated Parameter parameters = 5;

    // A list of enabled Task Types addresses for recording the event.
    repeated string enabledTaskTypes = 6;

    // A list of enabled Product Types addresses where recording the event.
    repeated string enabledProductTypes = 7;

    // A list of enabled derived Product Types addresses for the transformation of the product.
    repeated string enabledDerivedProductTypes = 8;
}
```

### Property Type
A property is a particular feature that you want to update over time, such as temperature or location.
A Property Type allow to define one of these particular properties to extend the events that can be recorded by operators on production batches. 
They perfectly marry the possibility of recording updates through non-human operators (ie. IoT sensors).

```protobuf
message PropertyType {
    // The Property Type unique identifier.
    string id = 1;

    // The Property Type name.
    string name = 2;

    // The Property Type information data type.
    TypeData.DataType dataType = 3;

    // A list of enabled Task Types addresses for recording the property.
    repeated string enabledTaskTypes = 4;

    // A list of enabled Product Types addresses where recording the property.
    repeated string enabledProductTypes = 5;
}
```

## Entities
### Company
The supply chain is composed by different companies which compete to decrease costs and to maximize earnings.
A direct consequence is the necessity of information integrity and reliability from untrusted parties without revealing any secret.
A Company is uniquely identified by the hash of the first ten characters of the public key of its Company Admin.
A Company has a list of authorized Operators to enable batch creation and event recording on their production resources.
If a Company is a primary production Company, then his production Fields are specified as well.

```protobuf
message Company {
    // The Company unique identifier (first 10 characters of Company Admin's public key).
    string id = 1;

    // The Company name.
    string name = 2;

    // A short description of the Company.
    string description = 3;

    // The Company website.
    string website = 4;

    // The Company Admin public key.
    string adminPublicKey = 5;

    // A list of enabled Product Types addresses used in the Company.
    repeated string enabledProductTypes = 6;

    // A list of Company Fields addresses (for production companies only).
    repeated string fields = 7;

    // A list of Company Operators public keys who are enabled to record.
    repeated string operators = 8;

    // A list of Company Batches addresses.
    repeated string batches = 9;

    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 10;
}
```

### Field
The primary production phase is the most insecure due to the introduction of un-tracked materials and products.
Whatever the system and technology is, it is impossible to eliminate these problems caused by the individuals.
However, it's possible to limit the creation of production batches using a prediction of the maximum production quantity of the Field.
For example, if someone introduce un-traced products without lowering the quantity of the Field, 
they would not be recorded in the system and it would be not possible to reconstruct their history of events.
The list of recorded Events related to the Field is stored inside the Field state object itself.

```protobuf
message Field {
    // The Field unique identifier.
    string id = 1;

    // A short description of the Field.
    string description = 2;

    // The owner Company address.
    string company = 3;

    // The Product Type address of the cultivable product.
    string product = 4;

    // The predicted maximum production quantity.
    float quantity = 5;

    // The Field approximate location coordinates.
    Location location = 6;

    // A list of Events state objects.
    repeated Event events = 7;
}
```

### Event
The Event state object represent the unique source of information about the relevant activities that are executed over production entities (Field and Batch).
Every Event will be stored inside a list of production entity events and not in separate state addresses because it's related only to the production entity.
Each Event refers to a particular recorded Event Type in order to get the template of necessary information. 
So, the Operator has to give values matching the constraints and requirements for each Parameter related to the Event (nb. description events only).
The quantity indicates an amount of product that will be subtract from the current production entity after it has been multiplied with conversion rate (nb. transformation events only).

```protobuf
message Event {
    message ParameterValue {
        // The Event Parameter Type address.
        string parameterType = 1;

        // Only one of these fields should be used according to Type.
        float floatValue = 2;
        string stringValue = 3;
        bytes bytesValue = 4;
    }

    // The Event Type address.
    string eventType = 1;

    // The public key of the Operator.
    string reporter = 2;

    // A list of values for each Parameter Type.
    repeated ParameterValue values = 3;

    // The quantity used when transform.
    float quantity = 4;

    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 5;
}
```

### Batch
A production Batch represent a quantity of a certain Product Type which is produced, processed, stored and moved along the supply-chain by companies.
The Batch identifier is used to identify the Batch along the entire supply chain.
Each Batch refers to the blockchain address of each parent production entity (Field/Batch) allowing the reconstruction of its *history*. 
The history is made up from the events from the individual parents of each Batch. 
Any change in the quantity is stored in the transactions history.
A Certification Authority can issue a certificate on a particular date, specifying links and hashes of the external document.
The Operators from the owner Company can issue a Proposal for the Batch to send it to another Company.
The Finalization is used to block other Events or Proposal recordings on the Batch.

```protobuf
message Batch {
    message Finalization {
        // The possible set of finalization reasons.
        enum Reason {
            WITHDRAWN = 0;
            SOLD = 1;
            EXPIRED = 2;
        }

        // The reason why the Batch is finalized.
        Reason reason = 1;

        // The public key of the reporter.
        string reporter = 2;

        // A short explanation for the finalization.
        string explanation = 3;
    }

    message Property {
        // The Property Type address.
        string propertyType = 1;

        // A list of values update for the Property Type.
        repeated PropertyValue values = 2;
    }

    message PropertyValue {
        // Only one of these fields should be used according to Type.
        double numberValue = 1;
        string stringValue = 2;
        bytes bytesValue = 3;
        Location locationValue = 4;

        uint64 timestamp = 5;
    }

    // The Batch unique identifier.
    string id = 1;

    // The Company state address.
    string company = 2;

    // The Product Type state address.
    string product = 3;

    // The Batch current quantity.
    double quantity = 4;

    // A list of company parent Fields addresses.
    repeated string parentFields = 5;

    // A list of company parent Batches addresses.
    repeated string parentBatches = 6;

    // A list of recorded Events.
    repeated Event events = 7;

    // A list of recorded Certificates.
    repeated Certificate certificates = 8;

    // A list of recorded Properties.
    repeated Property properties = 9;

    // A list of recorded Proposals.
    repeated Proposal proposals = 10;

    // The Finalization status.
    Finalization finalization = 11;

    // Approximately when transaction was submitted, as a Unix UTC timestamp.
    uint64 timestamp = 12;
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
The System Admin must specify a unique id among Task Types and a name for the task in order to create a Task Type.

```protobuf
message CreateTaskTypeAction {
    // The Task Type unique identifier.
    string id = 1;

    // The name of the task.
    string task = 2;
}
```

A Create Task Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No id specified.
* No task specified.
* The signer is not the System Admin.
* The id belongs to another Task Type.

### Create Product Type
The System Admin must provide a unique id among Product Types, a product name, an optional short description and the unit 
of measure for the quantity in order to create a Product Type.
If other Product Types derive from this one, the state address of these Product Types with the relative conversion rate for the quantity must be specified.

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
* No id specified.
* No name specified.
* Provided value for measure doesn't match any possible value.
* The signer is not the System Admin.
* There is a Product Type already associated to given id.
* Derived Product Type address must be a 70-char hex string.
* Specified derived Product Type does not exist.
* Specified conversion rate is not greater than zero.

### Create Event Parameter Type
The System Admin must provide a unique id among Event Parameter Types, a name and the information data type in order to 
create an Event Parameter Type.

```protobuf
message CreateEventParameterTypeAction {
    // The Event Parameter Type unique identifier.
    string id = 1;

    // The Event Parameter Type name.
    string name = 2;

    // The Event Parameter Type information data type.
    TypeData.DataType type = 3;
}
```

A Create Event Parameter Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No id specified.
* No name specified.
* Provided value for data type doesn't match any possible value.
* The signer is not the System Admin.
* The id ${id} belongs to another Event Parameter Type.

### Create Event Type
The System Admin must provide a unique id among Event Types, a name, the typology, a short description and four different lists
in order to create an Event Type.
The Parameters list can be specified to customize the information recording. For each Parameter additional features can be used.
The enabled Task and Product Types lists are used to filter, respectively, who and where the Event can be recorded.
For Event Type of *typology* equal to *TRANSFORMATION*, a list of enabled derived Product Types 
(ie. products resulting from the transformation of the initial product) must be specified.

```protobuf
message CreateEventTypeAction {
    // The Event Type unique identifier.
    string id = 1;

    // The Event Type typology.
    EventType.Typology typology = 2;

    // The Event Type name.
    string name = 3;

    // The Event Type description.
    string description = 4;

    // A list of Event Parameters with additional features.
    repeated EventType.Parameter parameters = 5;

    // A list of enabled Task Types addresses for recording the event.
    repeated string enabledTaskTypes = 6;

    // A list of enabled Product Types addresseswhere recording the event.
    repeated string enabledProductTypes = 7;

    // A list of enabled derived Product Types addresses for the transformation of the product.
    repeated string enabledDerivedProductTypes = 8;
}
```

A Create Event Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No id specified.
* Provided value for typology doesn't match any possible value.
* No name specified.
* No description specified.
* The signer is not the System Admin.
* The id belongs to another Event Type.
* At least one Task Type state address is not a valid Task Type address.
* At least one specified Task Type doesn't exist.
* At least one Product Type state address is not a valid Product Type address.
* At least one specified Product Type doesn't exist.
* At least one Event Parameter Type state address is not a valid Event Parameter Type address.
* At least one specified Event Parameter Type doesn't exist.
* No derived products specified for an event with transformation typology.
* At least one derived Product Type state address is not a valid Product Type address.
* At least one specified derived Product Type doesn't exist.
* At least one derived Product Type doesn't match a valid derived product for enabled Product Types.

### Create Property Type
The System Admin must provide a unique id among Property Types, a name, the information data type and two lists
in order to create an Property Type.
The enabled Task and Product Types lists are used to filter, respectively, who and where the Property can be recorded.

```protobuf
message CreatePropertyTypeAction {
    // The Property Type unique identifier.
    string id = 1;

    // The Property Type name.
    string name = 2;

    // The Property Type information data type.
    TypeData.DataType dataType = 3;

    // A list of enabled Task Types addresses for recording the property.
    repeated string enabledTaskTypes = 4;

    // A list of enabled Product Types addresses where recording the property.
    repeated string enabledProductTypes = 5;
}
```

A Create Property Type transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No id specified.
* No name specified.
* Provided value for data type doesn't match any possible value.
* The signer is not the System Admin.
* The id belongs to another Property Type.
* At least one Task Type state address is not a valid Task Type address.
* At least one specified Task Type doesn't exist.
* At least one Product Type state address is not a valid Product Type address.
* At least one specified Product Type doesn't exist.


### Create Certification Authority
The System Admin must provide a valid unused public key, a name, a website, and a list of Product Types 
in order to create a Certification Authority.
The enabled Product Types list is used to filter where the certificate can be recorded.

```protobuf
message CreateCertificationAuthorityAction {
    // The Certification Authority public key.
    string publicKey = 1;

    // The Certification Authority name.
    string name = 2;

    // The Certification Authority website.
    string website = 3;

    // A list of enabled Product Types addresses where recording the certificate.
    repeated string enabledProductTypes = 4;
}
```

A Create Certification Authority transaction is invalid if one of the following conditions occurs:
* The public key field doesn't contain a valid public key.
* No name specified.
* No website specified.
* The signer is not the System Admin.
* The public key belongs to another authorized user.
* At least one Product Type state address is not a valid Product Type address.
* At least one specified Product Type doesn't exist.

### Create Company
The System Admin must provide a name, a website, a short description, the Company Admin's public key and a list
in order to create a Company.
The enabled Product Types list is used to filter which products are enabled in the Company.
The Company identifier is derived from the first ten characters of the hash SHA-512 calculated on the Company Admin's public key.
The other lists must be left empty.
This action creates a new Company and Company Admin into the state.

```protobuf
message CreateCompanyAction {
    // The Company name.
    string name = 1;

    // A short description of the Company.
    string description = 2;

    // The Company website.
    string website = 3;

    // The Company Admin public key.
    string admin = 4;

    // A list of enabled Product Types addresses used in the Company.
    repeated string enabledProductTypes = 5;
}
```

A Create Company transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No name specified.
* No description specified.
* No website specified.
* The admin field doesn't contain a valid public key.
* The signer is not the System Admin.
* The public key belongs to another authorized user.
* At least one Product Type address is not well-formatted or not exists.

### Create Field
A Company Admin must provide an unique id among his Company Fields, a short description, the Product Type for the product which is cultivated in the Field,
the predicted maximum production quantity and the approximate location in coordinates.
This action create a new Field state object and update the fields list of the relative Company state object.

```protobuf
message CreateFieldAction {
    // The Field unique identifier.
    string id = 1;

    // A short description of the Field.
    string description = 2;

    // The Product Type address of the cultivable product.
    string product = 3;

    // The predicted maximum production quantity.
    float quantity = 4;

    // The Field approximate location coordinates.
    Location location = 5;
}
```

A Create Field transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No id specified.
* No description specified.
* No location specified.
* The signer is not a Company Admin.
* At least one Product Type address is not well-formatted or not exists.
* Product field doesn't match an enabled Company Product Type address.
* Quantity must be greater than zero.
* The id belongs to another company Field.

## Create Operator
A Company Admin can create an Operator enabled to record production batches and events for his Company. 
The Company Admin needs to specify the Operator public key and the Task Type associated to his role inside the Company. 
This action creates a new Operator into the state and updates the Company operators list.

```protobuf
message CreateOperatorAction {
    // The Operator's public key.
    string publicKey = 1;

    // The assigned Task Type address.
    string task = 2;
}
```

A Create Operator transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* The public key field doesn't contain a valid public key.
* The signer is not a Company Admin.
* At least one Task Type address is not well-formatted or not exists.
* The public key belongs to another authorized user.

## Create Description Event
The Operator must specify the related Event Type, a production entity (Batch or Field) where the Event will be recorded and an optional list of values for event Parameters.
The information regarding Event name, description, and so on, is gathered from the Event Type itself.
The transaction creates a new Event updating the events list for the provided production entity (Field or Batch).

```protobuf
message CreateDescriptionEventAction {
    // The Event Type address.
    string eventType = 1;

    // A company Batch address where recording the event.
    string batch = 2;

    // A company Field address where recording the event.
    string field = 3;

    // A list of values for each Parameter Type.
    repeated Event.ParameterValue values = 4;
}
```

A Create Description Event transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No Batch or Field specified.
* Either Batch and Field specified.
* The signer is not an Operator.
* Field/Batch doesn't match a Company Field.
* At least one Event Type address is not well-formatted or not exists.
* The Event Type is not a description Event Type.
* Operator task doesn't match an Event Type enabled task.
* Field/Batch product doesn't match an Event Type enabled product.
* No values specified for required Parameters.
* At least one Parameter Value is not valid for its related Parameter.

## Create Transformation Event
The transformation Event mechanism is used to create Batches from resources previously recorded (Field or Batch) in order to maintain a link between this resources quantities. 
The Operator must specify the related Event Type, a list of input production entities (Batches or Fields) to transform, 
a list of quantities to subtract from inputs, the output Product Type and a unique identifier for the output Batch.
The information regarding Event name, description, and so on, is gathered from the Event Type itself.
The transaction creates a new Event updating the events list for each provided input production entities (Fields or Batches).

```protobuf
message CreateTransformationEventAction {
    // The Event Type address.
    string eventType = 1;

    // A list of company Batches addresses to transform.
    repeated string batches = 2;

    // A list of company Fields addresses to transform.
    repeated string fields = 3;

    // A list of corresponding quantities for transformation.
    repeated double quantities = 4;

    // The output Product Type address.
    string derivedProduct = 5;

    // The output Batch unique identifier.
    string outputBatchId = 6;
}
```

A Create Transformation Event transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* No Batches or Fields list specified.
* Either Batches and Fields lists specified.
* No quantities list specified.
* No output batch id specified.
* The signer is not an Operator.
* At least one Field/Batch state address is not a Company Field/Batch.
* At least one Event Type address is not well-formatted or not exists.
* The Event Type is not a transformation Event Type.
* Operator task doesn't match an Event Type enabled task.
* At least a field/batch doesn't match other Field's/Batch's product Product Type.
* Fields/Batches Product Type doesn't match an Event Type enabled product.
* Derived Product Type doesn't match a derived Event Type enabled product.
* Derived Product Type doesn't match a Company enabled product.
* At least one quantity is not greater than zero.
* Quantities length doesn't match fields/batches length.
* A quantity is greater than current Field/Batch quantity.
* Output Batch id is already used for another Company Batch.

## Add Batch Certificate
The Certification Authority must specify the Batch and related Company state addresses, and the external resource link with its hash.

```protobuf
message AddBatchCertificateAction {
    // The Batch state address.
    string batch = 1;

    // The Company state address.
    string company = 2;

    // The Certificate external resource link.
    string link = 3;

    // The Certificate external resource hash.
    string hash = 4;
}
```
An Add Batch Certificate transaction is invalid if one of the following conditions occurs:
* Timestamp is not set.
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 


## Record Batch Property

## Create Proposal

## Answer Proposal

## Finalize Batch
