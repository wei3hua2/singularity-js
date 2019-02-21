/**
 * @module channel
 */

import { EventEmitter } from 'events';
import {Account} from './account';
import { Mpe } from './contracts/mpe';
import {Model} from './model';
import { Fetchable, GrpcModel } from './model';
import { ChannelState, ChannelStateResponse, ChannelStateOpts } from './channel-state';
import { SnetError } from './errors/snet-error';
import { Marketplace } from './marketplace';
import { TransactOptions, EventOptions, AllEventsOptions } from './eth';
import {EthUtil} from './eth';

class Channel extends Model implements Fetchable {
    id:number;

    nonce: number;
    sender: string;
    signer: string;
    recipient: string;
    groupId: string;
    value: number;
    expiration: number;
  
    balance_in_cogs?: number;
    pending?: number;
    endpoint?: string;

    _fetched: boolean;

    _eth: EthUtil;
 
    private constructor(account:Account, id: number, data?:any) {
        super(account);
        this.id = id;
        this._eth = account._eth;

        if(data) this.populate(data);
    }


    async getChannelState(opts?:ChannelStateOpts) : Promise<ChannelStateResponse> {
        if(!this.endpoint) throw new SnetError('channel_endpoint_not_found');
        
        const cs = new ChannelState(this.account, this.endpoint, this);
        return await cs.getState(opts);
    }

    async fetch(): Promise<boolean> {
        const channel = await this.getMpe().channels(this.id);
        this.populate(channel);
        return true;
    }

    private populate(contractChannel:any){
        this.nonce = parseInt(contractChannel.nonce);
        this.value = parseInt(contractChannel.value);
        this.expiration = parseInt(contractChannel.expiration);
        this.sender = contractChannel.sender;
        this.signer = contractChannel.signer;
        this.recipient = contractChannel.recipient;
        this.groupId = contractChannel.groupId;

        this.endpoint = contractChannel.endpoint || this.endpoint;
        this.balance_in_cogs = contractChannel.balance_in_cogs ? 
            parseInt(contractChannel.balance_in_cogs) : this.balance_in_cogs;
        this.pending = contractChannel.pending ? 
            parseInt(contractChannel.pending) : this.pending;
    }

    async signChannelId(privateKey:string = null): Promise<Uint8Array> {
        const sha3Message: string = this._eth.soliditySha3({t: 'uint256', v: this.id});

        const signed = (await this._eth.sign(sha3Message, {privateKey:privateKey})).signature;
        const stripped = signed.substring(2, signed.length);

        return new Uint8Array(stripped.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    }

    getByteChannelId(): Uint8Array {
        return this._eth.numberToBytes(this.id, 4);
    }

    public toString(): string {
        return `*** Channel : ${this.id}` +
            `\nnonce : ${this.nonce} , value : ${this.value}` +
            `\nbalance_in_cogs : ${this.balance_in_cogs} , pending : ${this.pending}` +
            `\nsender : ${this.sender} , signer : ${this.signer}` +
            `\nrecipient : ${this.recipient} , groupId : ${this.groupId}` +
            `\nendpoint : ${this.endpoint} , expiration : ${this.expiration}`;
    }

    static init(account:Account, channelId:number) {
        return new Channel(account, channelId);
    }

    static async openChannel(account:Account,signer:string, recipient:string, groupId:Uint8Array, 
        value:number, expiration:number, opts:TransactOptions={}):Promise<any> {
        const mpe = account.getMpe();

        const result = await mpe.openChannel(signer, recipient, groupId, value, expiration,opts);
        return result;
    }
    static listenOpenChannel(account:Account, opts:EventOptions):EventEmitter {
        const mpe = account.getMpe();
        return mpe.ChannelOpen(opts);
    }
    static listenOpenChannelOnce(account:Account, opts:EventOptions={}):Promise<any> {
        const mpe = account.getMpe();
        return mpe.ChannelOpenOnce(opts);
    }
    static PastOpenChannel(account:Account, opts:AllEventsOptions={}):Promise<any> {
        const mpe = account.getMpe();
        return mpe.PastChannelOpen(opts);
    }

    static getAllEvents(account:Account, opts:AllEventsOptions={}):Promise<any> {
        const mpe = account.getMpe();
        return mpe.allEvents(opts);
    }

    static async getAvailableChannels(
        account:Account, from:string, orgId:string, serviceId:string) {
        const marketplace = new Marketplace(account.getEthUtil());
        const mpe = account.getMpe();

        const channelResponse = (await marketplace.availableChannels(from, serviceId, orgId)).data;
        
        if(channelResponse.length == 0) return [];

        const channelMain = channelResponse[0];
        
        const channels = channelMain.channels;
        const endpoints = channelMain.endpoint;

        return channels.map((channel, index, chls) => {
            const c = Object.assign(channel,{
                endpoint: endpoints[index],
                groupId: channelMain.groupId,
                sender: channelMain.sender,
                recipient: channelMain.recipient
            });
            
            return new Channel(account, channel.channelId, c);
        });
    }
}

export {Channel}