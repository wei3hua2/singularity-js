# Snet

This is the main class of singularity-js. It provides basic operations to access information and run job.

To initialize a `Snet` object.

*   [Snet.init](#snet.init)
*   [utils](#utils)
*   [listOrganizations](#listOrganizations)
*   [getOrganization](#getOrganization)
*   [getService](#getService)
*   [runJob](#runJob)


## Snet.init
Init supports two approaches. __Private Key__ or __Wallet__.
* Private Key approach. Initialize the Snet object with 2 fields, *address* and *privateKey*.
* Wallet approach. Inject the *ethereum* object provided by plugin such as metamask.

To initialize an instance:
``` javascript
import {Snet} from 'singularity-js';
import Web3 from 'web3';

const web3Provider = 'wss://ropsten.infura.io/ws';
const web3 = new Web3(new Web3.providers.WebsocketProvider(web3Provider));

const ADDRESS = "ADDRESS_HERE";
const PRIVATE_KEY = "PRIVATE_KEY";

// for browser support
const ethereum = window.ethereum;

(async () => {
    // for node application
    const snet = await Snet.init(web3, {address: ADDRESS, privateKey: PRIVATE_KEY});

    // for browser application
    const snet = await Snet.init(web3, {ethereum: ethereum});
})();
```
#### Parameters
1. __web3__ web3 object for ethereum.
2. __InitOptions__ InitOptions.
    * address: the address of the account used. Not required if browser approach is used.
    * privateKey: private key of the account used. Not required if browser approach is used.
    * ethereum: Ethereum object injected by wallet plugin such as metamask. Not required if private key approach is used.

#### Returns
- __Snet__ Snet object.

## utils
Utility functions.
``` javascript
snet.utils
```
#### Parameters
none
#### Returns
- __Utils__ *Utils* utility functions. See [Utils](utils.md)

## listOrganizations
``` javascript
const organizations = snet.listOrganizations();
console.log(organizations.map(o => o.data));
// [ { id: 'snet' },
//   { id: 'SingularityLab' },
//   { id: 'DappTestOrganization' },
//   { id: 'DappTesOrganization' },
//   { id: 'holy-moly' }...]

const organizations = snet.listOrganizations({init:true});
console.log(organizations.map(o => o.data));
// [ { id: 'snet',
//     name: 'snet',
//     owner: '0xFF2a327ed1Ca40CE93F116C5d6646b56991c0ddE',
//     members:
//      [ '0x4b4546ce47089925E5792E0a6d085BfB876cE621',... ],
//     services: undefined },
//   { id: 'SingularityLab',
//     name: 'SingularityLab',
//     owner: '0x4acA1c99a999E87A7E22F71556003a2d434bf398', ...]
```
##### Parameters
1. __InitOptions__ (optional) for initialising a model.
    * init: default to false. Only id is retrieved.
##### Returns
- __OrganizationList__ *Promise<Organization[]>* List of organizations found in the blockchain.


## getOrganization
``` javascript
const organizationDetail = snet.getOrganization('snet');
console.log(organizationDetail.data);
// { id: 'snet',
//   name: 'snet',
//   owner: '0xFF2a327ed1Ca40CE93F116C5d6646b56991c0ddE',
//   members:
//      [ '0x4b4546ce47089925E5792E0a6d085BfB876cE621',... ]}

const organization = snet.getOrganization('snet', {init:false});
console.log(organization.data);
// { id: 'snet'}
```
##### Parameters
1. __OrganizationId__ (string) Organization Id to retrieve.
2. __InitOptions__ (optional)
    * init: default to true. get the organization detail.
    
##### Returns
- __Organization__ [Organization](organization.md) Object


## getService
``` javascript
const service = snet.getService('snet', 'example-service');
// { id: 'example-service',
//   organizationId: 'snet',
//   metadata:
//    { version: 1,
//      display_name: 'SingularityNET Example Service',
//      encoding: 'proto',
//      service_type: 'grpc', ... } },
//   tags: [ 'Service', 'Example', 'Arithmetic' ] }

const service = snet.getService('snet', 'example-service', {init:false});
// {id: 'example-service', organizationId: 'snet'}
```
##### Parameters
1. __OrganizationId__ organization Id.
2. __ServiceId__ service Id.
3. __InitOptions__ (optional) for initialising the organization.
    * init: default to true. 
    
##### Returns
- __Service__ [Service](service.md) Object


## runJob
For running a job. Refer to [service.runJob](service.md#run-job) for more detail.
``` javascript
 const jobPromise = snet.runJob('snet', 'example-service', 'add', {a:3, b:4}, {autohandle_channel: true});

jobPromise.on('selected_channel', channel => console.log(channel.data));

jobPromise.then(console.log);
```
##### Parameters
1. __OrganizationId__ organization Id.
2. __ServiceId__ service Id.
3. __Method__ method.
4. __Request__ Request object.
3. __Options__ (optional) for initialising the organization.
    
##### Returns
- __PromiseEvent__ [runJob](service.md#run-job) Object


