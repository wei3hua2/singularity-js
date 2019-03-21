FROM node:latest

WORKDIR /app

RUN git clone --branch build-for-deliverable https://github.com/wei3hua2/singularity-js.git

RUN npm install --prefix ./singularity-js
# RUN npm run test

ENV SINGNET_DISABLE_TEST_CONSOLE=true

CMD cd singularity-js && npm run test