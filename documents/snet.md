# Snet

This is the main class of singularity-js. It provides basic operations to access information and run job.

*   [Snet.init](#snet.init)
*   [listOrganizations](#listOrganizations)
*   [getOrganization](#getOrganization)
*   [getService](#getService)
*   [runJob](#runJob)


## Snet.init
To initialize an instance:
``` javascript
const snet = Snet.init(web3);

```
#### Parameters
1. __web3__ web3 object for ethereum.
#### Returns
- __Snet__ Snet object.
#### Examples
``` javascript
import {Snet} from 'singularity-js';
import {Web3} from 'web3.js';

const snet = Snet.init(web3);
const org = snet.getOrganization('snet');

org.then(console.log);

```

## listOrganizations
``` javascript
 const organizations = snet.listOrganizations({init:true});
```
##### Parameters
1. __InitOptions__ (optional) for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Snet__ Snet object.


## getOrganization
``` javascript
 const organization = snet.getOrganization('snet');
```
##### Parameters
1. __OrganizationId__ for initialising a model.
2. __Options__ for initialising the organization.
    
##### Returns
- __Organization__ [Organization](organization.md) Object


## getService
``` javascript
 const service = snet.getService('snet', 'example-service');
```
##### Parameters
1. __OrganizationId__ organization Id.
2. __ServiceId__ service Id.
3. __Options__ (optional) for initialising the organization.
    
##### Returns
- __Service__ [Service](service.md) Object


## runJob
``` javascript
 const jobPromise = snet.runJob('snet', 'example-service', 'add', {a:3, b:4}, {autohandle_channel: true});
```
##### Parameters
1. __OrganizationId__ organization Id.
2. __ServiceId__ service Id.
3. __Method__ method.
4. __Request__ Request object.
3. __Options__ (optional) for initialising the organization.
    
##### Returns
- __PromiseEvent__ [runJob](service.md#runJob) Object


