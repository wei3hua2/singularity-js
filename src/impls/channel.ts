/**
 * @module channel
 */

import { EventEmitter } from 'events';
import { Channel, ChannelState, Account } from '../models';
import {ChannelStateSvc} from './channel-state';
import { SnetError } from '../errors/snet-error';
import { Marketplace } from '../utils/marketplace';
import { TransactOptions, EventOptions } from '../utils/eth';
import {PromiEvent} from 'web3-core-promievent';

class ChannelSvc extends Channel {
    private constructor(account:Account, id: number, fields:any = {}) {
        super(account, id, fields);
    }

    async getChannelState(promi?: PromiEvent) : Promise<ChannelState> {
        if(!this.endpoint) throw new SnetError('channel_endpoint_not_found');
        
        const cs = new ChannelStateSvc(this.account, this.endpoint, this);
        return await cs.init(promi);
    }

    async extendAndAddFunds(newExpiration:number, amount:number):Promise<any> {
        return await this.account.mpe.channelExtendAndAddFunds(this.id, newExpiration, amount);
    }
    async channelAddFunds(value:number):Promise<any> {
        return await this.account.mpe.channelAddFunds(this.id, value);
    }
    async channelExtend(expiration:number):Promise<any> {
        return await this.account.mpe.channelExtend(this.id, expiration);
    }

    async claimTimeout(): Promise<any> {
        return await this.account.mpe.channelClaimTimeout(this.id);
    }

    public toString(): string {
        return `*** ChannelSvc : ${this.id}` +
            `\nnonce : ${this.nonce} , value : ${this.value}` +
            `\nbalance_in_cogs : ${this.balance_in_cogs} , pending : ${this.pending}` +
            `\nsender : ${this.sender} , signer : ${this.signer}` +
            `\nrecipient : ${this.recipient} , groupId : ${this.groupId}` +
            `\nendpoint : ${this.endpoint} , expiration : ${this.expiration}`;
    }

    static init(account:Account, channelId:number) {
        return new ChannelSvc(account, channelId);
    }

    static async openChannel(account:Account,signer:string, recipient:string, groupId:string, 
        value:number, expiration:number, opts:TransactOptions={}):Promise<any> {

        return await account.mpe.openChannel(signer, recipient, groupId, value, expiration,opts);
    }

    static listenOpenChannel(account:Account, opts:EventOptions):EventEmitter {
        return account.mpe.ChannelOpen(opts);
    }
    static listenOpenChannelOnce(account:Account, opts:EventOptions={}):Promise<any> {
        return account.mpe.ChannelOpenOnce(opts);
    }
    static PastOpenChannel(account:Account, opts:EventOptions={}):Promise<any> {
        return account.mpe.PastChannelOpen(opts);
    }

    static getAllEvents(account:Account, opts:EventOptions={}):Promise<any> {
        return account.mpe.allEvents(opts);
    }


    // static async getAvailableChannels(
    //     account:Account, from:string, orgId:string, serviceId:string) {

    //     const marketplace = new Marketplace(account.eth);

    //     const channelResponse = (await marketplace.availableChannels(from, serviceId, orgId)).data;
        
    //     if(channelResponse.length == 0) return [];

    //     const channelMain = channelResponse[0];
        
    //     const channels = channelMain.channels;
    //     const endpoints = channelMain.endpoint;

    //     return channels.map((channel, index, chls) => {
    //         const c = Object.assign(channel,{
    //             endpoint: endpoints[index],
    //             groupId: channelMain.groupId,
    //             sender: channelMain.sender,
    //             recipient: channelMain.recipient
    //         });
            
    //         return new ChannelSvc(account, channel.channelId, c);
    //     });
    // }
    
}

export {ChannelSvc}