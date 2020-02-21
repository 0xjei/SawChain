# SawChain
SawChain is a distributed application for improving food supply-chain management through blockchain technology.
It enables different parties to rely on a unique source of information and trust along the entire supply-chain. 
Smart contracts manage the sales of products, backtracking of events and non-anonymity of recordings.
A consortium can make up the whole configuration of the system using the complete customizable set of different types matching is use-case needs.
The benefits of SawChain are equally distributed from supply-chain stakeholders to external individuals. The security of data relies
on blockchain transactions history that mitigates the lack of trust and transparency, satisfying the high-demand of information availability and integrity. 

## Contents
- [Why Hyperledger Sawtooth](#why-hyperledger-sawtooth)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
    * [Requirements](#requirements)
    * [Sawtooth Node Start Up](#sawtooth-node-start-up)
    * [SawChain TP Tests](#sawchain-tp-tests)
- [Contributions](#contributions)
- [License](#license)

# Why Hyperledger Sawtooth
SawChain is designed to achieve data integrity and availability through a unique source of information between mutually-untrusted parties.
The food supply-chain management involves different kind of parties from industries to food control authorities. To guarantee interoperability
with regulators, preventing the write access to ones who are not authorized, a permissioned-blockchain seems to be the best fit.
The application is based on [Hyperledger Sawtooth](https://www.hyperledger.org/projects/sawtooth) which gives an high-degree of customization, scalability and permissions.
SawChain takes advantage from the core features of Sawtooth providing a generic customizable infrastructure for users, types, products and events.
After system bootstrap and configuration from an external peer who acts as a system administrator, every authorized operator is 
enabled to create/read data over batches of products.
Each data record has to pass through time and quantity constraint made possible exploiting the smart contract power and customization, 
mitigating the introduction of un-tracked products and decreasing errors from users. 
The huge volume of data and sensor transactions is satisfied by the high-scalability of Sawtooth.

# Architecture 
![Architecture overview](./images/architecture.png)

Running alongside the core components from Hyperledger Sawtooth, SawChain provides the Transaction Processor (TP, which means smart contract in Sawtooth jargon)
responsible for the entire supply-chain application logic. Each component will run in an individual "container" using [Docker](https://www.docker.com/products/container-runtime).
This directory includes a [docker-compose](docker-compose.yaml) file that contains the instructions for Docker to make up multiple components and network them together. 
The core prepackaged Sawtooth components are downloaded from [DockerHub](https://hub.docker.com/search/?q=sawtooth&type=image).
This table reports the endpoint connection, source and short description for each component represented in the architecture overview. 

| Name                   | Endpoint              | Source    | Description
| ---------------------- | --------------------- | --------- | ------------------------
| validator              | tcp://localhost:4004  | DockerHub | Validates blocks and transactions.
| rest-api               | http://localhost:8008 | DockerHub | Provides blockchain via HTTP/JSON.
| sawchain-processor     | --                    | custom    | The entire food supply-chain smart contract logic.
| shell                  | --                    | DockerHub | Environment for running Sawtooth commands.
| settings-tp            | --                    | DockerHub | Built-in Sawtooth transaction processor.

# Getting Started
This project use Docker to simplify dependencies and deployment.
After cloning this repo, follow the instructions specific to your OS to install and run whatever components are required 
to use `docker` and `docker-compose` from your command line. 
This is the only dependency required to run SawChain components because Docker takes care of each component.
If you want to test the Transaction Processor logic without downloading and running each component from Docker, you can follow the instructions specific 
to your OS to install and run [NodeJS](https://nodejs.org/en/download/). This tool is necessary to simulate a Sawtooth Validator process 
and test SawChain TP functionalities. The SawChain TP, Validator process mock and tests are made in JavaScript using the [Sawtooth JavaScript SDK](https://github.com/hyperledger/sawtooth-sdk-javascript). For test purpose [Mocha](https://github.com/mochajs/mocha) and [Chai](https://github.com/chaijs/chai) are used.

If you are in troubles with [Docker](https://www.docker.com/sites/default/files/d8/2019-09/docker-cheat-sheet.pdf) or [Sawtooth](https://sawtooth.hyperledger.org/docs/core/releases/latest/introduction.html).

## Requirements
You need to have installed:
- NodeJS >= 12.13.0
- Docker >= 19.03.5
- Docker Compose >= 1.24.1

## Sawtooth Node Start Up
Once Docker is installed and you've cloned this repo, navigate to the root project directory and run
```
docker-compose up
```

This will take awhile the first attempt because Docker needs to download each required image from DockerHub. However, when complete will be running all required components in separate containers.
Many of the components will be available through HTTP endpoints as reported in the previous table.

In bash you can shutdown these components with the key combination `ctrl-C`. 
You can shutdown and remove the containers (destroying their data), with the command
```
docker-compose down
```

Finally, the Sawtooth Node is locally deployed and ready to interactions through the REST APIs.

## SawChain TP Tests
You can test the SawChain TP features without downloading and running every Docker component.
From root folder, follow these instructions to see the lots of tests made during the development of SawChain TP.
```
cd /processor
npm i
npm run test
```

# Contributions
Keep in mind that this is a Proof of Concept (PoC) application developed according of a previous study which aim was to strengthened 
food supply-chains with blockchain technology ([paper](https://bit.ly/36OYrvn)). This project is not production ready by any means.
However, you are invited to play around with the project and use it as-is.

# License
SawChain is under the MIT software license. 

See [LICENSE](https://github.com/Jeeiii/AgriChain-Sawtooth-Demo/blob/master/LICENSE) file for more information.