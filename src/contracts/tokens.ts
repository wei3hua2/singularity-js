/**
 * @module snet
 */

import * as EventEmitter from 'eventemitter3';
import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-token-contracts/networks/SingularityNetToken.json';

// @ts-ignore
import AGITokenAbi from 'singularitynet-token-contracts/abi/SingularityNetToken.json';

import {Account} from '../models/account';
import { TransactOptions, EventOptions } from '../utils/eth';

class Tokens extends Contract {
    constructor(account:Account){ super(account); }

    getAbi(){ return AGITokenAbi; }
    getNetworkObj(){ return AGITokenNetworks; }

    name = () => this.callContract('name');
    totalSupply = () => this.callContract('totalSupply').then(parseInt);
    INITIAL_SUPPLY = () => this.callContract('INITIAL_SUPPLY').then(parseInt);
    decimals = () => this.callContract('decimals').then(parseInt)
    paused = () => this.callContract('paused');
    balanceOf = (address: string) => this.callContract('balanceOf', address).then((resp)=>parseInt(resp.balance));
    owner = () => this.callContract('owner');
    symbol = () => this.callContract('symbol');
    allowance = (owner: string, sender: string) => this.callContract('allowance', owner, sender).then(parseInt);

    transfer = (to: string, value: number) => this.transactContract('transfer', to, value);
    approve = (spender: string, value: number) => this.transactContract('approve', spender, value);
    transferOwnership = (newOwner: string) => this.transactContract('transferOwnership',newOwner);
    increaseApproval = (spender: string, addedValue: number) => this.transactContract('increaseApproval',spender, addedValue);
    decreaseApproval = (spender: string, subtractedValue: number) => this.transactContract('decreaseApproval',spender, subtractedValue);
    unpause = () => this.transactContract('unpause');
    pause = () => this.transactContract('pause');
    burn = (value: number) => this.transactContract('burn', value);
    transferFrom = (from: string, to: string, value: number) => this.transactContract('transferFrom', from, to, value);
    transferTokens = (beneficiary: string, amount: number) => this.transactContract('transferTokens', beneficiary, amount);

    Transfer = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('Transfer', type, opt);
    Burn = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('Burn', type, opt);
    Pause = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('Pause', type, opt);
    Unpause = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('Unpause', type, opt);
    OwnershipTransferred = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('OwnershipTransferred',type, opt);
    Approval = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('Approval', type, opt);
}

export {Tokens}