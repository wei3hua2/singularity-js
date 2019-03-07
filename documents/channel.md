# Channel

*   [getChannelState](#getChannelState)
*   [extendAndAddFunds](#extendAndAddFunds)
*   [channelAddFunds](#channelAddFunds)
*   [channelExtend](#channelExtend)
*   [claimTimeout](#claimTimeout)
*   [init](#init)
*   [data](#data)


## getChannelState
``` javascript
import {Snet, Channel} from 'singularity-js'

(async function() {
  const snet = await Snet.init(web3);
  const service = await snet.getService('snet', 'example-service');
  const channel = (await service.getChannels())[0];

  console.log((await channel.getChannelState()).data);
})();
```
##### Parameters
None
##### Returns
- __ChannelState__ ([ChannelState](#channel-state))


## extendAndAddFunds
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const expiration = 1000000;
const value_in_cogs = 10;

const response = await channel.extendAndAddFunds(expiration, value_in_cogs);

```
##### Parameters
1. __expiration__ (number)
2. __value__ (number) In cogs.
##### Returns
- 


## addFunds
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const value_in_cogs = 10;

const response = await channel.extendAndAddFunds(value_in_cogs);

```
##### Parameters
1. __value__ (number) In cogs.
##### Returns
- 

## channelExtend
``` javascript
import {Snet, Channel} from 'singularity-js'

...
const expiration = 10;

const response = await channel.channelExtend(expiration);

```
##### Parameters
1. __expiration__ (number)
##### Returns
-


## claimTimeout
``` javascript
import {Snet, Channel} from 'singularity-js'

...

const response = await channel.claimTimeout();

```
##### Parameters
None
##### Returns
-


# ChannelState

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