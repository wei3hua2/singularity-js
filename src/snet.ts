/**
 * @module Snet
 */

import {Eth} from './eth';

import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {Tokens} from './contracts/tokens';

import {Organization} from './organization';
import {Service} from './service';

import {Marketplace} from './marketplace';
import {Services} from './services';

import PromiEvent from 'web3-core-promievent';

class Options {
    web3Provider: string;
}

class Snet {
    web3: any;
    eth: Eth;
    contracts: {registry: Registry, mpe: Mpe, tokens: Tokens};
    marketplace: Marketplace;

    service: Services;

    constructor(web3:any, options?:Options) {
        this.eth = new Eth(web3);
        this.contracts = {
            tokens: new Tokens(this.eth), mpe: new Mpe(this.eth), registry: new Registry(this.eth)
        };

        this.marketplace = new Marketplace(this.eth);

        this.service = new Services(this.eth, this.contracts.mpe, this.contracts.registry);
    }

    /**
     * List organizations
     *
     * @remarks
     * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
     *
     * @param x - The first input number
     * @param y - The second input number
     * @returns The arithmetic mean of `x` and `y`
     *
     */
    async listOrganizations(): Promise<Organization[]>{
        const orgs = await Organization.listOrganizations(this.contracts.registry, this.contracts.mpe, this.marketplace, this.contracts.tokens);

        return orgs;
    }
    async getOrganization(orgId:string): Promise<Organization> {
        return await Organization.getById(this.contracts.registry, this.contracts.mpe, this.marketplace,this.contracts.tokens,orgId);
    }
    async getService(orgId:string, serviceId:string): Promise<Service> {
        const org = await this.getOrganization(orgId);
        const svc = await org.getService(serviceId);

        return svc;
    }


    // org -> * svc
    // svc -> * method , * channels, * types
    // account -> tokens, channels
    // channel ->
    
    // snet.runJob: orgId, serviceId, method, request, opts
    // service.runJob: method, request, opts
    // service.method: request, opts

    // case 1 : browser + metamusk
    // case 2 : node + private key
    runService (orgId:string, serviceId:string, method:string, 
        request:any, opts:SnetRunOptions= {}): PromiEvent {

        const promi = new PromiEvent();
        let channel, endpoint;

        this.getAvailableChannelInfo(promi, orgId, serviceId, opts.from).then((channelInfo) => {
            endpoint = channelInfo.endpoint;

            return this.handleChannel(promi, channelInfo, opts);

        }).then((channelInfo) => {
            channel = channelInfo;

            return this.getChannelState(promi, endpoint, channel, opts);

        }).then((curSignedAmt) => {

            return this.executeService(promi,
                orgId, serviceId, method, request,
                channel, endpoint, curSignedAmt, opts);

        }).then((response) => {

            promi.resolve(response);

        }).catch((error) => {

            promi.reject(error);

        });

        return promi;
    }

    private getAvailableChannels = (from:string, orgId:string, serviceId:string) =>
        this.marketplace.availableChannels(from, serviceId, orgId);

    private async getAvailableChannelInfo (promiEvent:any, orgId:string, serviceId:string, from:string) {
        const availableChannels = (await this.getAvailableChannels(from, orgId, serviceId)).data[0]; //TODO: change to blockchain call
        
        const recipient = availableChannels.recipient, groupId = availableChannels.groupId;
        const channel = availableChannels.channels[0], endpoint = availableChannels.endpoint[0];
        
        promiEvent.emit('recipient', recipient);

        return {
            availableChannels:availableChannels, recipient:recipient, groupId:groupId,
            channel:channel, endpoint:endpoint
        };
    }
    private async handleChannel (promi, channelInfo:any, opts) {
        if(!channelInfo.channel){
            const receipt = await this.contracts.mpe.openChannel(
                    opts.from, channelInfo.recipient, channelInfo.groupId, opts.amountInCogs,
                    opts.ocExpiration,{from:opts.from});

            promi.emit('channel_receipt', receipt);

            return 'TODO';
        } else {
            return channelInfo.channel;
        }
    }
    private async getChannelState (promi, endpoint, channel, opts) {
        const paymentSvc = await this.service.createChannelStateService(endpoint);
        const signedChannelId = await this.service.signChannelId(channel.channelId, opts.privateKey);
        const channelResponse = await paymentSvc['getChannelState'](signedChannelId);

        const curSignedAmt = parseInt('0x' + 
            Buffer.from(channelResponse.currentSignedAmount).toString('hex',0,channelResponse.currentSignedAmount.length));
        
        promi.emit('signedAmt',curSignedAmt);

        return curSignedAmt;
    }
    private async executeService (promi,
        orgId:string, serviceId:string, method:string, request:any,
        channel, endpoint:string, curSignedAmt:number, opts) {

        const svc = await this.service.createService(
            orgId, serviceId, channel, endpoint, 
            curSignedAmt,{privateKey:opts.privateKey});

        const response = await svc[method](request);

        promi.emit('response', response);

        return response;
    }


    static create (web3) {
        return new Snet(web3);
    }
}

interface SnetRunOptions {
    from?: string;
    privateKey?: string;
    amountInCogs?:number;
    ocExpiration?:number;
}

export {
    Snet,
    Registry, Mpe, Tokens, Marketplace, Services
};
