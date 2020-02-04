# AgriChain
This repository contains a simple distributed application demo for trace products and activities over a food supply chain
ecosystem relying on blockchain technology. This is a demo application developed according to one of my previous 
[studies](https://bit.ly/36OYrvn) over supply chains strengthened by blockchain technology. This demo contains: the smart contract (Transaction Processor) used to handle the entire
supply chain application logic, a bunch of tests to ensure the correctness of main behaviors and a set of dockerfiles to
make up a Hyperledger Sawtooth node with core components and supply chain smart contract logic. Due to customizable nature of this application, 
a client application is not provided, but can be made up based on the specific use case (there's not a customizable client planned yet).
The main motivation is facing the different challenges associated to supply chain management process,
such as the need of trust between stakeholders, the lack of data transparency that cause delays often due to incomplete or missing 
information and the increasingly request of availability and traceability of products information by parties and consumers.
A permissioned blockchain platform seems to be the best solution to fight these problems. 
This demo is developed on top of Hyperledger Sawtooth which ensure a common shared source of data records, guaranteeing transparency and integrity exploiting
the main characteristics of blockchain technology. 
Through a set of shared rules defined by the concept of smart contracts it will be possible to ensure trust between mutual untrusted parties.
Using permissioned blockchain benefits only a specific subset of authorized real world supply chain participants will be able to record and manage products according to a 
previously defined customizable set of types.
However, every customer or individual will be able to read the entire history of a product, according to a from farm to fork model.
 
The application is developed with the [JavaScript SDK](https://github.com/hyperledger/sawtooth-sdk-javascript) from Sawtooth,
[Mocha](https://github.com/mochajs/mocha) and [Chai](https://github.com/chaijs/chai) libraries for testing purposes and 
Google Protocol Buffers using [ProtobufJs](https://github.com/protobufjs/protobuf.js) library for supply chain types and Sawtooth
state definition.

## Usage
To run a Sawtooth node using Docker you only need to make up every component defined in the `docker-compose.yaml` file located in the root directory.
To do this you have to run the `docker-compose up` command. This builds, makes and connects different containers for each component.
Once all the components are running, you can interact with the Sawtooth node using your client through the REST API endpoint served at http://localhost:8008.
If you're familiar with Docker, you can modify each custom component based on your needs. You can stop each component using the command `docker-compose down -v`.

To run the tests of the Transaction Processor logic you have to navigate through `/processor` folder and use `npm run test` command.

## License
The application is licensed under the [MIT software license](https://github.com/Jeeiii/AgriChain-Sawtooth-Demo/blob/master/LICENSE).