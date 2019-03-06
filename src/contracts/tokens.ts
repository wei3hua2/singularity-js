/**
 * @module snet
 */

import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-token-contracts/networks/SingularityNetToken.json';

//@ts-ignore
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

    transfer = (to: string, value: number, txOpt:TransactOptions={}) => this.transactContract('transfer', txOpt, to, value);
    approve = (spender: string, value: number, txOpt:TransactOptions={}) => this.transactContract('approve', txOpt, spender, value);
    transferOwnership = (newOwner: string, txOpt:TransactOptions={}) => this.transactContract('transferOwnership',txOpt, newOwner);
    increaseApproval = (spender: string, addedValue: number, txOpt:TransactOptions={}) => this.transactContract('increaseApproval',txOpt, spender, addedValue);
    decreaseApproval = (spender: string, subtractedValue: number, txOpt:TransactOptions={}) => this.transactContract('decreaseApproval',txOpt, spender, subtractedValue);
    unpause = (txOpt:TransactOptions={}) => this.transactContract('unpause', txOpt);
    pause = (txOpt:TransactOptions={}) => this.transactContract('pause', txOpt);
    burn = (value: number, txOpt:TransactOptions={}) => this.transactContract('burn', txOpt, value);
    transferFrom = (from: string, to: string, value: number, txOpt:TransactOptions={}) => this.transactContract('transferFrom', txOpt, from, to, value);
    transferTokens = (beneficiary: string, amount: number, txOpt:TransactOptions={}) => this.transactContract('transferTokens', txOpt, beneficiary, amount);

    Transfer = (opt:EventOptions={}) => this.eventContract('Transfer', opt);
    
    Burn = (opt:EventOptions={}) => this.eventContract('Burn', opt);
    Pause = (opt:EventOptions={}) => this.eventContract('Pause', opt);
    Unpause = (opt:EventOptions={}) => this.eventContract('Unpause', opt);
    OwnershipTransferred = (opt:EventOptions={}) => this.eventContract('OwnershipTransferred', opt);
    Approval = (opt:EventOptions={}) => this.eventContract('Approval', opt);
}

export {Tokens}