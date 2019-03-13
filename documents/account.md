# Account
Contains the current logged in account. This class operations that helps with the account holder. Such as retrieving AGI token counts, deposit to escrow, add fund to existing channel etc.

*   [getAgiTokens](#getAgiTokens)
*   [getEscrowBalances](#getEscrowBalances)
*   [transfer](#transfer)
*   [depositToEscrow](#depositToEscrow)
*   [withdrawFromEscrow](#withdrawFromEscrow)
*   [escrowAllowance](#escrowAllowance)
*   [approveEscrow](#approveEscrow)
*   [getChannels](#getChannels)
*   [init](#init)
*   [data](#data)


## getAgiTokens
``` javascript
await acct.getAgiTokens();
> 0.1

await acct.getAgiTokens({inCogs:true});
> 10000000
```
##### Parameters
1. __Options__ *Object* (optional) options for token.
    * __inCogs__ *boolean* get token in cogs. else in AGI
##### Returns
- __number__ *Promise<number>* of AGI/Cog tokens.


## getEscrowBalances
``` javascript
await acct.getEscrowBalances();
> 0.1

await acct.getEscrowBalances({inCogs:true});
> 10000000
```
##### Parameters
1. __Options__ *Object* (optional) options for token.
    * __inCogs__ *boolean* get token in cogs. else in AGI
##### Returns
- __number__ *Promise<number>* of Escrow AGI tokens in cogs.


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
await acct.transfer('0xADDRESS', 1);

const testAcct = await AccountSvc.create(web3, {address:TEST_ACCOUNT});
await acct.transfer(testAcct, 1);

await acct.transfer('0xADDRESS', 100000000, inCog:true);
```
##### Parameters
1. __recipient__ *string|Account* Address to transfer to.
2. __amount__ *number* Amount in cog to transfer to.
3. __Options__ *Object* (optional) options for token.
    * __inCogs__ *boolean* get token in cogs. else in AGI
##### Returns
- __Receipt__ *Promise<any>*


## depositToEscrow
``` javascript
await acct.depositToEscrow(1);

await acct.depositToEscrow(100000000, {inCog:true});
```
##### Parameters
1. __amount__ *number* Amount in cog to transfer to.
2. __Options__ *Object* (optional) options for token.
    * __inCogs__ *boolean* get token in cogs. else in AGI
##### Returns
- __Receipt__ 


## withdrawFromEscrow
``` javascript
await acct.withdrawFromEscrow(1);

await acct.withdrawFromEscrow(100000000, {inCog:true});
```
##### Parameters
1. __amount__ (number) amount to withdraw from escrow.
2. __Options__ *Object* (optional) options for token.
    * __inCogs__ *boolean* get token in cogs. else in AGI
##### Returns
- __Receipt__ *Promise<any>*


## init
This is a mutable operation. 
``` javascript
await acct.init();
```
##### Parameters
none
##### Returns
- __Snet__ *Promise<Account>*


## data
``` javascript
console.log(acct.data);
// {address:'0xADDRESS', privateKey:'0xSECRET'}
```
##### Parameters
none
##### Returns
- __Data__ *Object*
    * __Address__ *string*
    * __PrivateKey__ *string*