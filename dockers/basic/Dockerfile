FROM node:latest

WORKDIR /app
RUN git clone https://github.com/wei3hua2/singularity-js.git

WORKDIR /app/singularity-js
RUN npm install
RUN npm run build

WORKDIR /app/basic
RUN npm install web3@1.0.0-beta.46
COPY index.js ./index.js

CMD node index.js
