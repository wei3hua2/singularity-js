/**
 * @module snet
 */

import * as EventEmitter from 'eventemitter3';
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

    deposit = (value:number) => this.transactContract('deposit',value);
    withdraw = (value:number) => this.transactContract('withdraw',value);
    transfer = (receiver:string, value:number) => this.transactContract('transfer',receiver,value);
    
    openChannel = (signer:string, recipient:string, groupId:string, value:number, expiration:number) => {
            const gId = this.eth.asciiToBytes(this.eth.atob(groupId));
            return this.transactContract('openChannel',signer, recipient, gId, value, expiration);
        }

    depositAndOpenChannel = (signer:string, recipient:string, groupId:string,
        value:number, expiration:number) => this.transactContract('depositAndOpenChannel',signer,recipient,groupId,value,expiration);
    channelExtend = (channelId:number, newExpiration:number) => this.transactContract('channelExtend',channelId,newExpiration);
    channelAddFunds = (channelId:number, amount:number) => this.transactContract('channelAddFunds',channelId,amount);
    channelExtendAndAddFunds = (channelId:number, newExpiration:number, amount:number) => this.transactContract('channelExtendAndAddFunds',channelId,newExpiration,amount);
    channelClaimTimeout = (channelId:number) => this.transactContract('channelClaimTimeout',channelId);
    // multiChannelClaim = (channelIds:number[], amounts:number[], isSendbacks:boolean[],
    //     v:string, s:string, r:string,txOpt:TransactOptions={}) => this.transactContract('multiChannelClaim',txOpt,channelIds,amounts,isSendbacks,v,s,r);
    // channelClaim = (channelId:number, amount:number, isSendback:boolean,
    //     v:string, s:string, r:string, txOpt:TransactOptions={}) => this.transactContract('channelClaim',txOpt,channelId,amount,isSendback,v,s,r);
    
    ChannelOpen = async (type: string, opt:EventOptions={}) => {
        if(opt.filter && opt.filter['groupId']) opt.filter['groupId'] = this.base64ToBytes(opt.filter['groupId']);
        
        const events = await this.event('ChannelOpen',type, opt);
        
        if(type === 'once') {
            return {
                id: parseInt(events.returnValues.channelId), nonce: parseInt(events.returnValues.nonce),
                sender: events.returnValues.sender, signer: events.returnValues.signer,
                recipient: events.returnValues.recipient, amount: parseInt(events.returnValues.amount),
                expiration: parseInt(events.returnValues.expiration), groupId: events.returnValues.groupId
            };
        } else
            return events.map(e => ({
                id: parseInt(e.returnValues.channelId), nonce: parseInt(e.returnValues.nonce),
                sender: e.returnValues.sender, signer: e.returnValues.signer,
                recipient: e.returnValues.recipient, amount: parseInt(e.returnValues.amount),
                expiration: parseInt(e.returnValues.expiration), groupId: e.returnValues.groupId
            }));
    }

    ChannelSenderClaim = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('ChannelSenderClaim', type, opt);
    ChannelExtend = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('ChannelExtend',type, opt);
    ChannelAddFunds = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('ChannelAddFunds',type, opt);
    DepositFunds = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('DepositFunds',type, opt);
    WithdrawFunds = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('WithdrawFunds',type, opt);
    TransferFunds = (type: string, opt:EventOptions={}): EventEmitter | Promise<any> => this.event('TransferFunds',type, opt);
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