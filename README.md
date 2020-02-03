# AgriChain
This is a distributed application for trace products and activities over a food supply chain ecosystem. Can be customized for a specific food 
supply chain use case, such as fresh food. There are many challenges associated with supply chain management, such as the need of trust between stakeholders often 
linked to their reputation, the lack of transparency and traceability increasingly requested by the final user, the difficulty of managing risks, 
delays or disruptions often due to incomplete or missing information. To tackle these challenges, this application runs on top of Hyperledger Sawtooth blockchain. 
The participants can relying on a common shared source of information, ensuring transparency and integrity of data records according to smart contracts.
You can simply define and trace your entities which are produced, processed and retailed through the supply chain between mutual untrusted parties.

This is a concept demo application according to my previous [study](https://bit.ly/36OYrvn). As reported, the Transaction
Processor and Google Protobufs are developed and tested in this repository. Also, you can use the Transaction Processor
in production taking advantage from Docker-ready configuration of the application. You only need your custom client application for
interaction and interfacing purposes with your custom entities.

The application is developed with [JavaScript SDK](https://github.com/hyperledger/sawtooth-sdk-javascript) from Sawtooth,
[Mocha](https://github.com/mochajs/mocha) and [Chai](https://github.com/chaijs/chai) libraries for testing purposes and 
Google Protocol Buffers using [ProtobufJs](https://github.com/protobufjs/protobuf.js) library for entity-state definition.

## Usage
To run a Sawtooth node using Docker, you have to run the `docker-compose.yaml` file in the root directory using the `up`
command without providing any other parameter.
```
docker-compose up
```
This builds everything defined in the compose file. Each component core and custom will be turned on. Once all the components 
are running, you can interact with the Sawtooth node using your client through the REST API endpoint (http://localhost:8008).
If you're familiar with Docker, you can see and modify each custom component. You can stop each component using this command.
```
docker-compose down -v
```

To run the Transaction Processor tests, you have to navigate through processor folder and run the npm command.
```
cd /processor
npm run test
```

## License
The application is licensed under the [MIT software license](https://github.com/Jeeiii/AgriChain-Sawtooth-Demo/blob/master/LICENSE).