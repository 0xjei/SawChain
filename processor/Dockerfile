FROM node:12.13.0

WORKDIR /processor

COPY package.json .

RUN npm install

ENTRYPOINT ["/usr/local/bin/node", "index.js"]
