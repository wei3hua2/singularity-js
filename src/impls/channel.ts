/**
 * @module channel
 */

import { Account } from '../models/account';
import { Channel, ChannelState } from '../models/channel';
import {ChannelStateSvc} from './channel-state';
import { SnetError, ERROR_CODE } from '../errors/snet-error';
import { TransactOptions, EventOptions } from '../utils/eth';
import {PromiEvent} from 'web3-core-promievent';


class ChannelSvc extends Channel {
    private constructor(account:Account, id: number, fields:any = {}) {
        super(account, id, fields);
    }

    async getChannelState(promi?: PromiEvent) : Promise<ChannelState> {
        if(!this.endpoint) throw new SnetError(ERROR_CODE.channel_endpoint_not_found, this);
        
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

    static async retrieve(account:Account, channelId:number, init:boolean=true): Promise<Channel> {
        const channel = new ChannelSvc(account, channelId);
        if(init) await channel.init();

        return channel;
    }

    static async openChannel(account:Account,signer:string, recipient:string, groupId:string, 
        value:number, expiration:number, opts:TransactOptions={}):Promise<any> {

        const blockNo = await account.eth.getBlockNumber();

        await account.mpe.openChannel(signer, recipient, groupId, value, expiration,opts);

        const channels = await account.mpe.ChannelOpen('past', {
            filter: {recipient: recipient, sender: signer, signer: signer, groupId: groupId},
            fromBlock: blockNo
        });
        const channel = channels[0];
        channel.value = channel.amount;
        delete channel.amount;

        return new ChannelSvc(account, channel.id, channel);
    }

    static getAllEvents(account:Account, opts:EventOptions={}):Promise<any> {
        return account.mpe.allEvents(opts);
    }
    
}

class InitOption {
    init: boolean;
}

export {ChannelSvc}