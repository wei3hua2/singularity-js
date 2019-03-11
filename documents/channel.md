# Channel
Model for Service's  Channel and Channel state.

``` javascript
// list of existing channels for the service.
const channels = await service.getChannels();

// new channel created.
const channel = await service.openChannel();
```

*   [getChannelState](#getChannelState)
*   [extendAndAddFunds](#extendAndAddFunds)
*   [addFunds](#addFunds)
*   [extend](#extend)
*   [claimTimeout](#claimTimeout)
*   [init](#init)
*   [data](#data)


## getChannelState
``` javascript
const channelState = await channel.getChannelState();

console.log((channelState.data);
// {channelId: 123, endpoint: 'https://bh.singularitynet.io:7052', currentSignedAmount: 14}
```
##### Parameters
None
##### Returns
- __ChannelState__ *[Promise:ChannelState](#channel-state)*


## extendAndAddFunds
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const expiration = 1000000;
const value_in_cogs = 10;

const response = await channel.extendAndAddFunds(expiration, value_in_cogs);

```
##### Parameters
1. __expiration__ (number|string)
2. __value__ (number|string) In cogs.
##### Returns
- __receipt__ 


## addFunds
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const value_in_cogs = 10;

const response = await channel.extendAndAddFunds(value_in_cogs);

```
##### Parameters
1. __value__ (number|string) In cogs.
##### Returns
- __receipt__

## extend
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const expiration = 100000;

const response = await channel.channelExtend(expiration);

```
##### Parameters
1. __expiration__ (number|string)
##### Returns
- __receipt__


## claimTimeout
``` javascript
import {Snet, Channel} from 'singularity-js'

...

const response = await channel.claimTimeout();

```
##### Parameters
None
##### Returns
- __receipt__


# ChannelState
``` javascript
const channelState = await channel.getChannelState();
console.log(channelState.data);
// {channelId: 123, endpoint: 'https://bh.singularitynet.io:7052', currentSignedAmount: 14}
```
*   [data](#data)

## data
##### Parameters
None
##### Returns
- __Object__ 
    * channelId
    * endpoint
    * url
    * currentSignature
    * currentNonce 