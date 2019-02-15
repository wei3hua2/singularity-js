import {Eth} from './eth';

import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {Tokens} from './contracts/tokens';

import {Accounts} from './accounts';
import {Channels} from './channels';
import {Identity} from './identity';
import {Marketplace} from './marketplace';
import {Organizations} from './organizations';
import {Services} from './services';

import {Ipfs} from './ipfs';

class Options {
    web3Provider: string;
}


class Snet {
    web3: any;
    eth: Eth;
    contracts: {registry: Registry, mpe: Mpe, tokens: Tokens};
    marketplace: Marketplace;

    accounts: Accounts;
    channels: Channels;
    identity: Identity;
    organizations :Organizations;
    service: Services;

    constructor(web3:any, options?:Options) {
        this.eth = new Eth(web3);

        this.contracts = {
            tokens: new Tokens(this.eth),
            mpe: new Mpe(this.eth),
            registry: new Registry(this.eth)
        };

        this.marketplace = new Marketplace(this.eth);
        this.service = new Services(this.eth, this.contracts.mpe, this.contracts.registry);

        this.channels = new Channels(this.marketplace);
    }

    getOrganizations = () => this.marketplace.organizations();
    getOrganizationServices = (orgId:string) =>this.marketplace.organizationServices(orgId);
    getUserChannels = (address:string) => this.marketplace.getChannels(address);
    getService = (orgId:string, serviceId:string) => this.marketplace.organizationService(orgId, serviceId);
    getAvailableChannels = (from:string, orgId:string, serviceId:string) =>
        this.marketplace.availableChannels(from, serviceId, orgId);

    async runService (orgId:string, serviceId:string, method:string, 
        request:any, opts:SnetRunOptions= {}) {

        // console.log('params : '+orgId+' , '+serviceId+' , '+method+' , '+opts.from);

        const availableChannels = 
            (await this.getAvailableChannels(opts.from, orgId, serviceId)).data[0];
        const recipient = availableChannels.recipient;
        const groupId = availableChannels.groupId;

        let channel, endpoint;
        if(availableChannels.channels.length === 0) {   
            console.log('no available channels');
            // 1. init channel: TODO
            const receipt = await this.contracts.mpe.openChannel(opts.from, recipient,
                groupId, opts.amountInCogs, opts.ocExpiration,{from:opts.from});
            console.log(receipt);
        }
        else {
            channel = availableChannels.channels[0];
            endpoint = availableChannels.endpoint[0];
        }
        // console.log(channel);
        // console.log(endpoint);

        const paymentSvc = await this.service.createChannelStateService(endpoint);
        const signedChannelId = await this.service.signChannelId(channel.channelId, opts.privateKey);
        const channelResponse = await paymentSvc['getChannelState'](signedChannelId);

        const curSignedAmt = parseInt('0x' + 
            Buffer.from(channelResponse.currentSignedAmount)
                  .toString('hex',0,channelResponse.currentSignedAmount.length));

        const svc = await this.service.createService(orgId, serviceId, 
            channel, endpoint, curSignedAmt,{privateKey:opts.privateKey});
        const response = await svc[method](request);
        console.log('response : ');
        console.log(response);

        return response;
    }

    private mergeWithDefault (opts) {
        return opts;
    }

    static create (web3) {
        return new Snet(web3);
    }
}

interface SnetRunOptions{
    from?: string;
    privateKey?: string;
    amountInCogs?:number;
    ocExpiration?:number;
}

export {
    Snet,
    Registry, Mpe, Tokens, Accounts, Organizations,
    Channels, Identity, Marketplace, Services
};