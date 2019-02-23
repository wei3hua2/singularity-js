/**
 * @module snet
 */

import {Contract} from './contract';
//@ts-ignore
import AGITokenNetworks from 'singularitynet-platform-contracts/networks/MultiPartyEscrow.json';
//@ts-ignore
import AGITokenAbi from 'singularitynet-platform-contracts/abi/MultiPartyEscrow.json';

import {TransactOptions, EventOptions} from '../eth';
import {Account} from '../account';

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

    depositAndOpenChannel = (signer:string, recipient:string, groupId:Uint8Array,
        value:number, expiration:number,txOpt:TransactOptions={}) => this.transactContract('depositAndOpenChannel',txOpt,signer,recipient,groupId,value,expiration);
    multiChannelClaim = (channelIds:number[], amounts:number[], isSendbacks:boolean[],
        v:string, s:string, r:string,txOpt:TransactOptions={}) => this.transactContract('multiChannelClaim',txOpt,channelIds,amounts,isSendbacks,v,s,r);
    channelClaim = (channelId:number, amount:number, isSendback:boolean,
        v:string, s:string, r:string, txOpt:TransactOptions={}) => this.transactContract('channelClaim',txOpt,channelId,amount,isSendback,v,s,r);
    channelExtend = (channelId:number, newExpiration:number, txOpt:TransactOptions={}) => this.transactContract('channelExtend',txOpt,channelId,newExpiration);
    channelAddFunds = (channelId:number, amount:number, txOpt:TransactOptions={}) => this.transactContract('channelAddFunds',txOpt,channelId,amount);
    channelExtendAndAddFunds = (channelId:number, newExpiration:number, amount:number, txOpt:TransactOptions={}) => this.transactContract('channelExtendAndAddFunds',txOpt,channelId,newExpiration,amount);
    channelClaimTimeout = (channelId:number, txOpt:TransactOptions={}) => this.transactContract('channelClaimTimeout',txOpt,channelId);
    
    ChannelOpen = (opt:EventOptions={}) => this.eventContract('ChannelOpen',opt);
    ChannelClaim = (opt:EventOptions={}) => this.eventContract('ChannelClaim',opt);
    ChannelSenderClaim = (opt:EventOptions={}) => this.eventContract('ChannelSenderClaim',opt);
    ChannelExtend = (opt:EventOptions={}) => this.eventContract('ChannelExtend',opt);
    ChannelAddFunds = (opt:EventOptions={}) => this.eventContract('ChannelAddFunds',opt);
    DepositFunds = (opt:EventOptions={}) => this.eventContract('DepositFunds',opt);
    WithdrawFunds = (opt:EventOptions={}) => this.eventContract('WithdrawFunds',opt);
    TransferFunds = (opt:EventOptions={}) => this.eventContract('TransferFunds',opt);

    ChannelOpenOnce = (opt:EventOptions={}) => this.onceContract('ChannelOpen',opt);
    PastChannelOpen = (opt:EventOptions={}) => this.pastEventsContract('ChannelOpen',opt);


    base64ToBytes(b64Val:string): string {
        return this.eth.asciiToBytes(this.eth.atob(b64Val));
    }
}

export {Mpe}