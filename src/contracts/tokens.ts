/**
 * @module Contract
 */

import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-token-contracts/networks/SingularityNetToken.json';

//@ts-ignore
import AGITokenAbi from 'singularitynet-token-contracts/abi/SingularityNetToken.json';

import {ContractTxOptions} from './contract';

class Tokens extends Contract {
    constructor(eth: any){ super(eth); }

    getAbi(){ return AGITokenAbi; }
    getNetworkObj(){ return AGITokenNetworks; }

    name = () => this.callContract('name');
    totalSupply = () => this.callContract('totalSupply').then(parseInt);
    INITIAL_SUPPLY = () => this.callContract('INITIAL_SUPPLY').then(parseInt);
    decimals = () => this.callContract('decimals').then(parseInt)
    paused = () => this.callContract('paused');
    balanceOf = (address: string) => this.callContract('balanceOf', address).then(parseInt);
    owner = () => this.callContract('owner');
    symbol = () => this.callContract('symbol');
    allowance = (owner: string, sender: string) => this.callContract('allowance', owner, sender).then(parseInt);

    approve = (spender: string, value: number, txOpt: ContractTxOptions) => this.transactContract('approve', txOpt, spender, value);
    transferOwnership = (newOwner: string, txOpt: ContractTxOptions) => this.transactContract('transferOwnership',txOpt, newOwner);
    increaseApproval = (spender: string, addedValue: number, txOpt: ContractTxOptions) => this.transactContract('increaseApproval',txOpt, spender, addedValue);
    decreaseApproval = (spender: string, subtractedValue: number, txOpt: ContractTxOptions) => this.transactContract('decreaseApproval',txOpt, spender, subtractedValue);
    unpause = (txOpt: ContractTxOptions) => this.transactContract('unpause', txOpt);
    pause = (txOpt: ContractTxOptions) => this.transactContract('pause', txOpt);
    burn = (value: number, txOpt: ContractTxOptions) => this.transactContract('burn', txOpt, value);
    transfer = (to: string, value: number, txOpt: ContractTxOptions) => this.transactContract('transfer', txOpt, to, value);
    transferFrom = (from: string, to: string, value: number, txOpt: ContractTxOptions) => this.transactContract('transferFrom', txOpt, from, to, value);
    transferTokens = (beneficiary: string, amount: number, txOpt: ContractTxOptions) => this.transactContract('transferTokens', txOpt, beneficiary, amount);

    Burn = () => this.eventContract('Burn');
    Pause = () => this.eventContract('Pause');
    Unpause = () => this.eventContract('Unpause');
    OwnershipTransferred = () => this.eventContract('OwnershipTransferred');
    Approval = () => this.eventContract('Approval');
    Transfer = () => this.eventContract('Transfer');
}

export {Tokens}