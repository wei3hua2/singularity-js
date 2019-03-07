# Singularity-JS (Work In Progress)
> Javascript library for singularitynet


One to two paragraph statement about your product and what it does.

## Prerequisite

* web3.js version 1 and beyond
* node 

## Installation


```sh
npm install singularity-js --save
```


## Usage example

```javascript

import {Snet} from 'singularity-js';
import Web3 from 'web3';

// Kovan = wss://kovan.infura.io/ws  
// Mainnet = wss://mainnet.infura.io/ws
const web3Provider = 'wss://ropsten.infura.io/ws';
const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));

(async () => {
    const snet = await Snet.init(web3);
    const evt = snet.runJob("snet", "example-service", "add", {a:5, b:6});

    evt.on("channel", (channel) => {
        console.log("channel used : " + channel);
    });
    evt.then((response) => {
        console.log(response.value);
    });

})();


```

Initialize a Snet instance by injecting `web3` object. 


To run a job, pass in the following parameters: 1. organization id, 2. service id, method of the service, 4. payload.


## Models


*   [Snet](documents/snet.md)
*   [Organization](documents/organization.md)
*   [Service](documents/service.md)
*   [Account](documents/account.md)
*   [Channel](documents/channel.md)
<!-- *   [Repository](documents/repository.md) -->
<!-- *   [Contract](modules/contract.md) -->
<!-- *   [Error](modules/error.md) -->
<!-- *   [Marketplace](modules/marketplace.md) -->
<!-- *   [Utils](modules/utils.md) -->


## Release History

* 0.1.0
    * The first proper release
    * CHANGE: Rename `foo()` to `bar()`

## Meta

James Chong – [@wei3hua2](https://twitter.com/wei3hua2) – [email@jameschong.me](mailto:email@jameschong.me)

Distributed under the MIT license. See ``LICENSE`` for more information.

[LICENSE](LICENSE)

