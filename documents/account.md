# Account
Contains the current logged in account. This class operations that helps with the account holder. Such as retrieving AGI token counts, deposit to escrow, add fund to existing channel etc.

*   [Account.create](#Account.create)
*   [getAgiTokens](#getAgiTokens)
*   [getEscrowBalances](#getEscrowBalances)
*   [getChannels](#getChannels)
*   [transfer](#transfer)
*   [escrowAllowance](#escrowAllowance)
*   [approveEscrow](#approveEscrow)
*   [depositToEscrow](#depositToEscrow)
*   [withdrawFromEscrow](#withdrawFromEscrow)
*   [init](#init)
*   [data](#data)

## Account.create
``` javascript
import {Account} from 'singularity-js';

// for browser application
Account.create(web3, {ethereum: ethereum}).then((acct) => {
    console.log(acct.data);
});

const ADDRESS = "0xADDRESS";
const PRIVATEKEY = "PRIVATE_KEY";
//using private key
Account.create(web3, {address: ADDRESS, privateKey: PRIVATEKEY}).then(
    (acct) => console.log(acct.data));
```
##### Parameters
1. __Web3__ (Web3) ethereum web3 object.
2. __options__ (optional) options for account creation.
  * ethereum 
  * address
  * privateKey
##### Returns
- __Account__ Account object.


## getAgiTokens
``` javascript
acct.getAgiTokens().then(console.log);
> 1000
```
##### Parameters
None
##### Returns
- __number__ Number of AGI tokens in cogs.


## getEscrowBalances
``` javascript
acct.getEscrowBalances().then(console.log);
> 10
```
##### Parameters
None
##### Returns
- __number__ Number of Escrow AGI tokens in cogs.


## getChannels
Get channels for this account.
``` javascript
acct.getChannels().then(console.log);
```
##### Parameters
1. __Filter__ (Object) optional. If not pass, it will get all channels.

##### Returns
- __Channels__ (Channel[]) List of channels.


## transfer
Transfer AGI token to a given address.
``` javascript
acct.transfer('0xADDRESS', 10).then(())
```
##### Parameters
1. __recipient__ (string) Address to transfer to.
2. __amount__ (number) Amount in cog to transfer to.
##### Returns
- __Object__ 


## allowance
Get allowance based ERC20 token. 
``` javascript
acct.allowance().then(())
```
##### Parameters
None
##### Returns
- __Allowance__ (number). 


## approve
Approval based on ERC20 token. 
``` javascript
acct.approve('0XADDRESS').then(())
```
##### Parameters
- __Address__ (string). Approved address.
##### Returns


## depositToEscrow
``` javascript
acct.depositToEscrow(10).then(console.log);
```
##### Parameters
1. __amount__ (number) Amount to deposit to escrow.
##### Returns
- __Snet__ Snet object.


## withdrawFromEscrow
``` javascript
acct.withdrawFromEscrow(10).then(console.log);
```
##### Parameters
1. __amount__ (number) amount to withdraw from escrow.
##### Returns
- __Snet__ Snet object.


## init
``` javascript
```
##### Parameters
1. __InitOptions__ Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Snet__ Snet object.


## data
``` javascript
```
##### Parameters
1. __InitOptions__ Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Snet__ Snet object.