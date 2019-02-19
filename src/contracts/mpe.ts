/**
 * @module snet
 */

import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-platform-contracts/networks/MultiPartyEscrow.json';
//@ts-ignore
import AGITokenAbi from 'singularitynet-platform-contracts/abi/MultiPartyEscrow.json';

import {ContractTxOptions} from './contract';

class Mpe extends Contract {
    constructor(eth: any){ super(eth); }

    getAbi(){ return AGITokenAbi; }
    getNetworkObj(){ return AGITokenNetworks; }

    balances = (address: string) => this.callContract('balances', address);
    channels = (channelId: number) => this.callContract('channels', channelId);
    nextChannelId = () => this.callContract('nextChannelId');
    token = () => this.callContract('token');

    deposit = (value:number, txOpt:ContractTxOptions) => this.transactContract('deposit',txOpt,value);
    withdraw = (value:number, txOpt:ContractTxOptions) => this.transactContract('withdraw',txOpt,value);
    transfer = (receiver:string, value:number, txOpt:ContractTxOptions) => this.transactContract('transfer',txOpt,receiver,value);
    openChannel = (signer:string, recipient:string, groupId:string,
        value:number, expiration:number,txOpt:ContractTxOptions) => this.transactContract('openChannel',txOpt, signer, recipient, groupId,value,expiration);
    depositAndOpenChannel = (signer:string, recipient:string, groupId:string,
        value:number, expiration:number,txOpt:ContractTxOptions) => this.transactContract('depositAndOpenChannel',txOpt,signer,recipient,groupId,value,expiration);
    multiChannelClaim = (channelIds:number[], amounts:number[], isSendbacks:boolean[],
        v:string, s:string, r:string,txOpt:ContractTxOptions) => this.transactContract('multiChannelClaim',txOpt,channelIds,amounts,isSendbacks,v,s,r);
    channelClaim = (channelId:number, amount:number, isSendback:boolean,
        v:string, s:string, r:string, txOpt:ContractTxOptions) => this.transactContract('channelClaim',txOpt,channelId,amount,isSendback,v,s,r);
    channelExtend = (channelId:number, newExpiration:number, txOpt:ContractTxOptions) => this.transactContract('channelExtend',txOpt,channelId,newExpiration);
    channelAddFunds = (channelId:number, amount:number, txOpt:ContractTxOptions) => this.transactContract('channelAddFunds',txOpt,channelId,amount);
    channelExtendAndAddFunds = (channelId:number, newExpiration:number, amount:number, txOpt:ContractTxOptions) => this.transactContract('channelExtendAndAddFunds',txOpt,channelId,newExpiration,amount);
    channelClaimTimeout = (channelId:number, txOpt:ContractTxOptions) => this.transactContract('channelClaimTimeout',txOpt,channelId);
    
    ChannelOpen = () => this.eventContract('ChannelOpen');
    ChannelClaim = () => this.eventContract('ChannelClaim');
    ChannelSenderClaim = () => this.eventContract('ChannelSenderClaim');
    ChannelExtend = () => this.eventContract('ChannelExtend');
    ChannelAddFunds = () => this.eventContract('ChannelAddFunds');
    DepositFunds = () => this.eventContract('DepositFunds');
    WithdrawFunds = () => this.eventContract('WithdrawFunds');
    TransferFunds = () => this.eventContract('TransferFunds');
}

export {Mpe}