# Service

Model for the agent service. 

*   [runJob](#runJob)
*   [info](#info)
*   [defaultRequest](#defaultRequest)
*   [pingDaemonHeartbeat](#pingDaemonHeartbeat)
*   [init](#init)
*   [data](#data)
*   [openChannel](#openChannel)
*   [getChannels](#getChannels)

## runJob
Execute the job of the service.

There are 2 mode for running `runJob` method.
  * [Auto Channel management]("#auto-channel-management").
  * [Manual Channel management]("#manual-channel-management").


### Auto Channel management
``` javascript
 const promiEvent = service.runJob('add', {a: 5, b: 6}, {
     channel_autohandle: true
 });

 promiEvent.then(console.log);
 // {value: 11}
```
#### Workflow

1. *get_available_channels*: get a list of channels for this service.

2. *open_new_channel*: call `openChannel(channel_topup_amount, channel_topup_expiration)` and use the newly created channel. triggered if there is no available channels.

3. *selected_channel*: the newly open channel or  the largest `channelId` from the list of channels.

4. *sign_channel_state*: signing the key for calling the service agent channel state.

5. *channel_state*: the response from calling the service state.

6. *channel_extend_and_add_funds*: extend and add funds to the selected channel if amount < signed amount and expiration has expired.

7. *channel_add_funds*: add funds to the selected channel if amount < signed amount.

8. *channel_extend_expiration*: extend expiration to the selected channel if expiration has expired.

9. *sign_request_header*: signing the key for service call.

10. *request_info*: request information.

11. *response*: result of the service call.

### Manual Channel management
``` javascript
// if channel available, use the first channel. example
const channel = (await service.gtChannels())[0];

// if no channel, create a new channel with 100 cogs and expiration
const channel = await service.openChannel(100, 'currentBlockNo + 10');

const promiEvent = service.runJob('add', {a: 5, b: 6}, {
     use_channel_id: channel.id
 });
promiEvent.then(console.log);
// {value: 11}
```

##### Parameters
1. __Method__ (string) method name.
2. __Request__ (Object) request payload for the job. 
3. __options__ (Object) optional. Options for running the job.
    * __use_channel_id__ (number) Default to null.
    * __channel_autohandle__ (boolean) Auto handling the logic for valid channel. Default to false.
    * __channel_min_amount__ (number) Default to signedAmount + 5.
    * __channel_min_expiration__ (number) Default to payment threshold + 1.
    * __channel_topup_amount__ (number) Default to signedAmount + 5.
    * __channel_topup_expiration__ (number) Default to payment threshold + 1.
##### Returns
- __PromiseEvent__ (PromiEvent<Object>).

### RunJobState
__available_channels__ - a list of channels available for the service.  
__create_new_channel__ - create a new channel.  
__selected_channel__ - channel chosen.  
__sign_channel_state__ - signing the request header for checking the channel state in agent daemon.  
__channel_state__ - channel state information  
__channel_extend_and_add_funds__  
__channel_add_funds__  
__channel_extend_expiration__  
__sign_request_header__ - signing the request header for the grpc service call.  
__request_info__ - request information for the service call.  
__response__ - response from the service.  
__all_events__ - triggered when any of the events is triggered.


## info
Get the information on the service.
``` javascript
 const info = service.info();
```
##### Parameters
none
##### Returns
- __ServiceInfo__ Detail of the service. See [ServiceInfo](#service-info).


## defaultRequest
get sample request payload for the method. This method auto generate an object template that follows the structure of the request payload.
``` javascript
 const requestPayload = service.defaultRequest('add');
 console.log(requestPayload);
 > {a:0, b:0}
```
##### Parameters
1. __Method__ (string) Method name.
##### Returns
- __Request__ (Object) The payload for the method.

## info
Get the information on the service.
``` javascript
 const info = service.info();
```
##### Parameters
none
##### Returns
- __ServiceInfo__ Detail of the service. See [ServiceInfo](#service-info).


## pingDaemonHeartbeat
ping the service daemon for status check.
``` javascript
 const heartbeat = await service.pingDaemonHeartbeat();
 console.log(heartbeat);
//  { daemonID:
//    '46af9d997fcff0dc172c6c109ac2e7e2e11b08a41f83680cee5567875536057a',
//   timestamp: 1552446317,
//   status: 'Online',
//   serviceheartbeat: '{"serviceID":"SERVICE001", "status":"SERVING"}' }
```
##### Parameters
none
##### Returns
- __StatusHeartbeat__ (Statusheartbeat) daemon status heartbeat.


## init
Initialize the full detail of the service.
``` javascript
const service = await snet.getService('snet','example-service');
console.log(service.isInit);
// false
console.log(service.data);
// {id: 'example-service', organizationId: 'snet'}

await service.init();

console.log(service.isInit);
// true
console.log(service.data);
// { id: 'example-service',
//   organizationId: 'snet',
//   metadata:
//    { version: 1,
//      display_name: 'SingularityNET Example Service',
//      encoding: 'proto',
//      service_type: 'grpc', ... } },
//   tags: [ 'Service', 'Example', 'Arithmetic' ] }
```
##### Parameters
none
##### Returns
- __Service__ the service object. This method is mutable, thus reassignment is not required.


## data
Get the full data of the service.
``` javascript
 console.log(service.data);
 > {id:'example-service', organizationId:'snet',...}
```
##### Parameters
None
##### Returns
- __id__ *string*
- __organizationId__ *string*
- __metadata__ *[ServiceMetadata](#service-metadata)*
- __tags__ *string[]*

## getChannels
Get the list of channel for this service.

``` javascript
const channels = await service.getChannels();

```

#### Parameters
- __InitOptions__ *{init: boolean}*

#### Returns
- __channels__ *Promise<Channel[]>*



## openChannel
Open a new channel for this service.
``` javascript
const channel = await service.openChannel(100, 100000);
```

#### Parameters
- __amount__ *number|string* Amount in cogs to be deposited.
- __expiration__ *number|string* The expiration limit.

## Returns
- __channel__ (Promise<Channel>) Opened channel.

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


# ServiceInfo

__name__ (string),  
__methods__ {  
&nbsp;&nbsp;&nbsp;__[method-name]__ (string) {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__request__  {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__name__ (string),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__fields__ (ServiceFieldInfo)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__response__ {  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__name__ (string),  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__fields__ (ServiceFieldInfo)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}  
&nbsp;&nbsp;&nbsp;}  
    }  

## ServiceFieldInfo
__[name]__ (string) {  
&nbsp;&nbsp;&nbsp;__type__ (string),  
&nbsp;&nbsp;&nbsp;__required__ (boolean),  
&nbsp;&nbsp;&nbsp;__optional__ (boolean)  
}


## ServiceHeartbeat
__daemonID__ (string),  
__timestamp__ (number),  
__status__ (string),  
__serviceheartbeat__  {  
&nbsp;&nbsp;&nbsp;__serviceID__ (string),  
&nbsp;&nbsp;&nbsp;__status__ (string)  
}
