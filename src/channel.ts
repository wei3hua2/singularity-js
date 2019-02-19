/**
 * @module channel
 */

 import { Eth } from './eth';
 import { Mpe } from './contracts/mpe';
import { Core } from './core';
import { ChannelState } from './channel-state';
import { SnetError } from './errors/snet-error';
import { Marketplace } from './marketplace';

class Channel extends Core {
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
 
    constructor(web3:any, id: number, data?:any) {
        super(web3);
        this.id = id;

        if(data) this.populate(data);
    }


    initChannelState() : ChannelState{
        if(!this.endpoint) throw new SnetError('channel_endpoint_not_found');
        
        return new ChannelState(this.endpoint, this);
    }

    async fetch() {
        const channel = await this._mpe.channels(this.id);
        this.populate(channel);
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

    async signChannelId(privateKey:string = null) {
        return this._eth.signMessage([{t: 'uint256', v: this.id}], privateKey);
    }

    getByteChannelId() {
        const byteschannelID = Buffer.alloc(4);
        byteschannelID.writeUInt32BE(this.id, 0);

        return byteschannelID;
    }

    public toString(): string {
        return `*** Channel : ${this.id}` +
            `\nnonce : ${this.nonce} , value : ${this.value}` +
            `\nbalance_in_cogs : ${this.balance_in_cogs} , pending : ${this.pending}` +
            `\nsender : ${this.sender} , signer : ${this.signer}` +
            `\nrecipient : ${this.recipient} , groupId : ${this.groupId}` +
            `\nendpoint : ${this.endpoint} , expiration : ${this.expiration}`;
    }

    static openChannel() {}

    static getChannel(web3:any, channelId:number) {
        return new Channel(web3, channelId);
    }

    static async getAvailableChannels(
        web3:any, from:string, orgId:string, serviceId:string) {
        const marketplace = new Marketplace(new Eth(web3));
        const mpe = new Mpe(web3);

        const channelMain = (await marketplace.availableChannels(from, serviceId, orgId)).data[0];
        const channels = channelMain.channels;
        const endpoints = channelMain.endpoint;

        return channels.map((channel, index, chls) => {
            const c = Object.assign(channel,{
                endpoint: endpoints[index],
                groupId: channelMain.groupId,
                sender: channelMain.sender,
                recipient: channelMain.recipient
            });
            
            return new Channel(mpe, channel.channelId, c);
        });
    }
}

export {Channel}