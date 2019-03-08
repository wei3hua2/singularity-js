/**
 * @module snet
 */

import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-platform-contracts/networks/MultiPartyEscrow.json';
//@ts-ignore
import AGITokenAbi from 'singularitynet-platform-contracts/abi/MultiPartyEscrow.json';

import {TransactOptions, EventOptions} from '../utils/eth';
import {Account} from '../models/account';

class Mpe extends Contract {
    constructor(account:Account){ super(account); }

    getAbi(){ return AGITokenAbi; }
    getNetworkObj(){ return AGITokenNetworks; }

    balances = (address: string) => this.callContract('balances', address).then(parseInt);
    nextChannelId = () => this.callContract('nextChannelId').then(parseInt);
    token = () => this.callContract('token');
    channels = (channelId: number) => this.callContract('channels', channelId).then(
        (channel)=> ({
            nonce: parseInt(channel.nonce), value: parseInt(channel.value),
            expiration: parseInt(channel.expiration),
            groupId: channel.groupId, recipient: channel.recipient,
            sender: channel.sender, signer: channel.signer
        }));

    deposit = (value:number, txOpt:TransactOptions={}) => this.transactContract('deposit',txOpt,value);
    withdraw = (value:number, txOpt:TransactOptions={}) => this.transactContract('withdraw',txOpt,value);
    transfer = (receiver:string, value:number, txOpt:TransactOptions={}) => this.transactContract('transfer',txOpt,receiver,value);
    
    openChannel = (signer:string, recipient:string, groupId:string, value:number, expiration:number,
        txOpt:TransactOptions={}) => {
            const gId = this.eth.asciiToBytes(this.eth.atob(groupId));
            return this.transactContract('openChannel',txOpt, signer, recipient, gId, value, expiration);
        }

    depositAndOpenChannel = (signer:string, recipient:string, groupId:string,
        value:number, expiration:number,txOpt:TransactOptions={}) => this.transactContract('depositAndOpenChannel',txOpt,signer,recipient,groupId,value,expiration);
    channelExtend = (channelId:number, newExpiration:number, txOpt:TransactOptions={}) => this.transactContract('channelExtend',txOpt,channelId,newExpiration);
    channelAddFunds = (channelId:number, amount:number, txOpt:TransactOptions={}) => this.transactContract('channelAddFunds',txOpt,channelId,amount);
    channelExtendAndAddFunds = (channelId:number, newExpiration:number, amount:number, txOpt:TransactOptions={}) => this.transactContract('channelExtendAndAddFunds',txOpt,channelId,newExpiration,amount);
    channelClaimTimeout = (channelId:number, txOpt:TransactOptions={}) => this.transactContract('channelClaimTimeout',txOpt,channelId);
    // multiChannelClaim = (channelIds:number[], amounts:number[], isSendbacks:boolean[],
    //     v:string, s:string, r:string,txOpt:TransactOptions={}) => this.transactContract('multiChannelClaim',txOpt,channelIds,amounts,isSendbacks,v,s,r);
    // channelClaim = (channelId:number, amount:number, isSendback:boolean,
    //     v:string, s:string, r:string, txOpt:TransactOptions={}) => this.transactContract('channelClaim',txOpt,channelId,amount,isSendback,v,s,r);
    
    ChannelOpen = async (type: string, opt:EventOptions={}) => {
        if(opt.filter && opt.filter['groupId']) opt.filter['groupId'] = this.base64ToBytes(opt.filter['groupId']);
        
        const events = await this.event('ChannelOpen',type, opt);
        
        return events.map(e => ({
            channelId: parseInt(e.returnValues.channelId), nonce: parseInt(e.returnValues.nonce),
            sender: e.returnValues.sender, signer: e.returnValues.signer,
            recipient: e.returnValues.recipient, amount: parseInt(e.returnValues.amount),
            expiration: parseInt(e.returnValues.expiration), groupId: e.returnValues.groupId
        }));
    }

    ChannelSenderClaim = (type: string, opt:EventOptions={}) => this.event('ChannelSenderClaim', type, opt);
    ChannelExtend = (type: string, opt:EventOptions={}) => this.event('ChannelExtend',type, opt);
    ChannelAddFunds = (type: string, opt:EventOptions={}) => this.event('ChannelAddFunds',type, opt);
    DepositFunds = (type: string, opt:EventOptions={}) => this.event('DepositFunds',type, opt);
    WithdrawFunds = (type: string, opt:EventOptions={}) => this.event('WithdrawFunds',type, opt);
    TransferFunds = (type: string, opt:EventOptions={}) => this.event('TransferFunds',type, opt);
    // ChannelClaim = (opt:EventOptions={}) => this.eventContract('ChannelClaim',opt);

    // PastChannelOpen = async (opt:EventOptions={}) => {
    //     if(opt.filter && opt.filter['groupId']) opt.filter['groupId'] = this.base64ToBytes(opt.filter['groupId']);
    //     const events = await this.pastEventsContract('ChannelOpen',opt);
        
    //     return events.map((evt) => {
    //         evt.returnValues.channelId = parseInt(evt.returnValues.channelId);
    //         evt.returnValues.nonce = parseInt(evt.returnValues.nonce);
    //         evt.returnValues.amount = parseInt(evt.returnValues.amount);
    //         evt.returnValues.expiration = parseInt(evt.returnValues.expiration);

    //         return evt;
    //     });
    // }


    base64ToBytes(b64Val:string): string {
        return this.eth.asciiToBytes(this.eth.atob(b64Val));
    }
}

export {Mpe}