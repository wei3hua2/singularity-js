# Service

Model for the agent service. 

``` javascript
import {Snet} from 'singularity-js';
import Web3 from 'web3';

const web3 = new Web3(...);

(async () => {
    
    const snet = Snet.init(web3, {address: ADDRESS, privateKey: PRIVATE_KEY}); //for using private key
    // const snet = Snet.init(web3, {ethereum: ethereum}); //for metamusk
    const exampleSvc = await snet.getService('snet', 'example-service');

    // get full information of the service.
    const info = exampleSvc.info();
    console.log(info.something);
    console.log(info.somethingelse);

    // get the list of channels for the service
    const channels = await exampleSvc.getChannels();
    console.log( channels.map(c => c.toString()+'\n') );

    // get sample request payload
    const request = exampleSvc.defaultRequest('add');
    console.log(request)  // {a:0, b:0}
    request.a = 5;
    request.b = 9;

    const promi = exampleSvc.runJob('add', request);
    promi.on('something', (res) => console.log(res));
    promi.then((response) => console.log(response));
})();

```

*   [info](#info)
*   [defaultRequest](#defaultRequest)
*   [init](#init)
*   [data](#data)
*   [runJob](#runJob)
*   [openChannel](#openChannel)
*   [getChannels](#getChannels)



## info
``` javascript
 const info = service.info();
```
##### Parameters
1. __InitOptions__ Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Snet__ Snet object.


## defaultRequest
get sample request payload for the method
``` javascript
 const requestPayload = service.defaultRequest('add');
 console.log(requestPayload);
 > {a:0, b:0}
```
##### Parameters
1. __Method__ (string) Method name.
##### Returns
- __Request__ (Object) The payload for the method


## init
``` javascript
 const organizations = snet.listOrganizations({init:true});
```
##### Parameters
1. __InitOptions__ Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Snet__ Snet object.


## data
``` javascript
 console.log(JSON.stringify(service.data));
```
##### Parameters
None
##### Returns
- __id__ (string)
- __organizationId__ (string)
- __metadata__ ([ServiceMetadata](#service-metadata))
- __tags__ (string[])


## runJob
``` javascript
 const promiEvent = service.runJob('add', {a: 33, b: 44}, {});
```
##### Parameters
1. __Method__ (string) method name.
2. __Request__ (Object) request payload for the job. 
3. __options__ (Object) optional. Options for running the job.
    * __use_channel_id__ (number) Default to undefined.
    * __autohandle_channel__ (boolean) Auto handling the logic for valid channel. Default to true.
    * __channel_min_amount__ (number) Default to 1.
    * __channel_min_expiration__ (number) Default to current block + payment threshold.
##### Returns
- __PromiEvent__ 

### RunJobState
__available_channels__ - a list of channels available for the service.  
__create_new_channel__ - create a new channel.  
__add_fund_extend_expiration__ - add fund and/or extend  the expiration.  
__selected_channel__ - channel chosen.  
__sign_channel_state__ - signing the request header for checking the channel state in agent daemon.  
__channel_state__ - channel state information  
__sign_request_header__ - signing the request header for the grpc service call.  
__request_info__ - request information for the service call.  
__response__ - response from the service.  

__allowance__ - the allowance of the sender account.  
__approve__ - approve the transfer from sender to escrow account.


# ServiceMetadata

- __version__ (number)
- __display_name__ (string)
- __encoding__ (string)
- __service_type__ (string)
- __payment_expiration_threshold__ (string)
- __model_ipfs_hash__ (string)
- __mpe_address__ (string)
- __pricing__: { __price_model__ (string), __price_in_cogs__ (number) }
- __groups__: { __group_name__ (string), __group_id__ (string), __payment_address__ (string) } [],
- __endpoints__ { __group_name__ (string), __endpoint__ (string) } [],
- __service_description__ { __description__ (string), __url__ (string) }

