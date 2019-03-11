# Singularity-JS (Work In Progress)
> Javascript library for singularitynet


Singularity-Js is the javascript library for Singularitynet. The library supports both browser and node application.

### What is SingularityNet?

SingularityNet a decentralize marketplace for AI services. Through the marketplace, users can utilize the list of AI services to perform complex and state-of-the-art algorithm without the need to deal with complicated mathematics or complex operations.

The pricing follows the per-as-you-use model. Services are paid with the AGI token (AGI), which is an ethereum utility token that complies to the ERC20 standard.

This library provides easy access to the services made available on the marketplace. With a few lines of codes, High-tech scale algorithm is readily accessible without the need to tap into expensive phD-level AI engineers' expertise.


## Prerequisite

* web3.js version 1 and beyond
* node 
* AGI tokens.

For browser:

* Browser plugin wallet: metamusk etc.

## Demo

Please refer to [this link]("TODO") for the the demo of the library implemented in Angular. The repository of this demo can be found at [singularity-js-demo]("TODO").


## Installation


```sh
npm install singularity-js --save
```

## Concept (simplified)

SingularityNet is not a provider, but an intermediary platform that bridges the supply (AI service providers. developers, researchers etc), and demand (service consumer. businesses, hobyists etc). Everyone can be a supplier and consumer by utilizing tools provided by Singularity Foundation.

The supplier can easily get started by creating an __Organization__ with the blockchain via the [CLI tool](https://github.com/singnet/snet-cli) provided by the SingularityNet foundation. 

With the organization created, the supplier can create __Services__, that provide access to AI algorithms. A typical use case of such services range from image recognition, text translation, to anything that you can think of.

Payment resolution mechanism is involved when accessing the service. A __Multi Party Escrow__ , as the words suggest, is the mechanism for payment resolution. Consumers have to first deposit their AGI token to the escrow service to be able to access to the services. To handle the resolution of individual service, __Channel__ has to be created with sufficient funds deposited and valid expiration period.

__diagram__


For more comprehensive reading, please refer to the [Singularitynet whitepaper](https://public.singularitynet.io/whitepaper.pdf).



## Usage

As of now, this library primarily focus is to access the services provided (demand-side).

### Getting started

#### The Manual approach

The example assumes that there is available AGI tokens in your account.

``` javascript
import {Snet} from 'singularity-js';
import Web3 from 'web3';

const web3Provider = 'wss://ropsten.infura.io/ws';
const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));

(async () => {
    const snet = await Snet.init(web3);

    // 1. deposit to escrow (in cogs).
    await snet.depositToEscrow(100);

    // 2. get the service you want to access.
    const svc = await snet.getService('snet', 'example-service');
    console.log(svc.data);
    // {id:'example-service', }

    // 3. create a new channel for the service.
    const channel = await svc.openChannel(100, 10000);
    console.log(channel.data);
    // {id:129, ...}

    // 4. call example-service to perform basic addition arithmetic.
    const request = svc.defaultRequest('add');
    request.a = 5;
    request.b = 6;

    const response = await svc.runJob('add', request, {use_channel_id: channel.id});
    console.log(response);
    // {value: 11}

})();

```
#### The Auto approach

An alternative approach is to delegate the channel handling to the logic flow provided by this library.

```javascript

import {Snet} from 'singularity-js';
import Web3 from 'web3';

const web3Provider = 'wss://ropsten.infura.io/ws';
const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));

(async () => {
    const snet = await Snet.init(web3);

    const response = await snet.runJob("snet", "example-service", "add", {a:5, b:6}, {autohandle_channel: true});

    console.log(response);
    // {value: 11}

})();
```

### Getting the information

Information on Organizations, Services and Channels are available via some of the methods below.

#### Organization
``` javascript
// 1. list all organizations
const organizations = await snet.listOrganization();
console.log(organization[0].data);
// {id: 'snet'}

const organizationDetails = await snet.listOrganization({init: true}); //for more detailed information
console.log(organizationDetails[0].data);
// {id: 'snet', ...}

// 2. get single organization detail
const organization = await snet.getOrganization('snet');
console.log(organization.data);
// {id: 'snet', ...}


```

#### Service
``` javascript
// 1. get services information from organization
const services = await organization.getServices();

const serviceDetails = await organization.getServices({init: true});

// 2. get a specific service
const service = await snet.getService('snet', 'example-service');
console.log(service.data);
// {id:'example-service', 'organizationId:'snet', ...}

```

#### Channel
Channel is required to make a service call. It is 
``` javascript
const channels = await service.getChannels();

console.log(Array.isArray(channels));
// true

const channel = channels[0];
// display channel information if channel is found.
console.log(channel.data);
// {id: 123, ...}

const channelState = await channel.getState();
console.log(channelState.data)
// {...}
```

#### Account
An account object is used to model the current account. Account is created at when `Snet` is instantiated. To access the account object:
``` javascript
const snet = await Snet.init(web3);
const account = snet.account;

```


### Running the Job

Running a job can be done at the root level or service level. In order to track the steps of the job, `runJob` returns [`PromiEvent`]("https://www.npmjs.com/package/web3-core-promievent") instead of `Promise`. 


``` javascript
const snet = await Snet.init(web3);

const request = {a:5, b:6};

// root level
const responseRoot = await snet.runJob('snet', 'example-service', 'add', request);

// or 

//service level
const exampleService = await snet.getService('snet', 'example-service');
const responseSvc = await exampleService.runJob('add', request);

console.log(responseRoot.value === responseSvc.value);
// true

```

#### Options

To handle the workflow for auto channel handling, the method provides a list of options.

    use_channel_id: (number) Optional. default to null.
    channel_autohandle: (boolean) Optional. default to false.
    channel_min_amount: (number|string) Optional. default to signedAmount.
    channel_min_expiration: (number|string) Optional. default to currentBlockNo.
    channel_topup_amount: (number|string) Optional. default to signedAmount.
    channel_expiration_extend: (number|string) Optional. default to currentBlockNo.

``` javascript
// channel not handled automatically. Will throw an error if channel not found, expired, or fail to meet required amount.
response = await exampleService.runJob('add', request, {use_channel_id: 1234});

// Channel is auto created, topup fund or extend expiration if fail to meet criteria. 
response = await exampleService.runJob('add', request, {autohandle_channel: true});

```

For a more comprehensive explanation, please refer to [RunJobOptions](documents/service.md#run-job-state).

#### Job execution state

In order to track the execution of the job, PromiEvent is used. The maintain a list of events that will be fired when the state triggered.

``` javascript
const jobEvents = exampleService.runJob('add', request, {autohandle_channel:true});

// trigger when list of channels are retrieved.
jobEvents.on('available_channels', (channels) => console.log(channels));
// Array

// output response
jobEvents.then(response => console.log(response));
// {value:11}
```

For the list of running state and workflow, refer to [Here](documents/service.md).


## Documentations

For the full list of APIs.
*   [Snet](documents/snet.md)
*   [Organization](documents/organization.md)
*   [Service](documents/service.md)
*   [Account](documents/account.md)
*   [Channel](documents/channel.md)
*   [Error](documents/error.md)


## Release History

* 0.1.0
    * The first proper release

## Meta

James Chong – [@wei3hua2](https://twitter.com/wei3hua2) – [email@jameschong.me](mailto:email@jameschong.me)

Distributed under the MIT license. See ``LICENSE`` for more information.

[LICENSE](LICENSE)

