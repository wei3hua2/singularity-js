/**
 * @module snet
 * @preferred
 * 
 * Main module. To instantiate other model, please use this module.
 */

import {Organization} from './organization';
import {Account} from './account';
import {Service, RunJobOption} from './service';
import PromiEvent from 'web3-core-promievent';

/**
 * Main class of the library. To execute a job, instance has to be instantiate with the `init` static method.
 * 
 * 
 * ```typescript
 * import {Snet} from 'singularitynet-js';
 * 
 * const instance = Snet.init(web3)
 * 
 * ```
 */
class Snet {
    protected web3: any;
    protected currentAccount: Account;
    protected opts:InitOption;

    /**
     * @hidden
     */
    private constructor(web3:any, opts:InitOption={}) {
        this.web3 = web3;
        this.opts = opts;
    }

    async init():Promise<boolean> {
        if(this.opts.privateKey && this.opts.address)
            this.currentAccount = await Account.create(this.web3,{address:this.opts.address, privateKey:this.opts.privateKey});
        else
            this.currentAccount = await Account.create(this.web3);
        
        return true;
    }

    /**
     * List organizations available on the blockchain.
     *
     * @remarks
     * Only id is populated. To get the detail, call the fetch method in [[Organization]].
     *
     * @returns A list of organization.
     *
     */
    listOrganizations(): Promise<Organization[]>{
        return Organization.listOrganizations(this.web3);
    }

    /**
     * Get organization instance given an organization Id.
     *
     * @param Organization Id. example: snet
     * 
     * @returns Organization detail.
     *
     */
    getOrganization(orgId:string): Promise<Organization> {
        return Organization.init(this.web3,orgId);
    }


    /**
     * Get service instance given an organization and service Id.
     *
     * @param orgId example: snet
     * @param serviceId example: example-service
     * 
     * @returns Service detail.
     *
     */
    async getService(orgId:string, serviceId:string): Promise<Service> {
        return Service.init(this.web3, orgId, serviceId);
    }

    /**
     * 
     * run job
     * 
     * @param orgId organization Id. example: snet
     * @param serviceId service Id. example: example-service
     * @param method method to run. example: add
     * @param request payload for the method: example {a:1, b:3}
     * @param opts Options for running a job
     * 
     * @returns PromiEvent. This is the object used for web3.js
     * 
     */
    runJob (orgId:string, serviceId:string, method:string, 
        request:any, opts:RunJobOption= {}): PromiEvent {

        const promi = Service.init(this.web3, orgId, serviceId).runJob(method, request, opts);

        return promi;
    }




    /**
     * 
     * Initialize the main instance for Snet
     * 
     * @param web3 
     * @param opts 
     */
    static async init (web3, opts:InitOption={}): Promise<Snet> {
        const snet = new Snet(web3, opts);
        await snet.init();
        
        return snet;
    }
}

class InitOption {
    web3Provider?: string;
    address?: string;
    privateKey?: string;
}

export {
    Snet
};

    // org -> * svc
    // svc -> * method , * channels, * types
    // account -> tokens, channels
    // channel ->
    
    // snet.runJob: orgId, serviceId, method, request, opts
    // service.runJob: method, request, opts
    // service.method: request, opts

    // case 1 : browser + metamusk
    // case 2 : node + private key

// private getAvailableChannels = (from:string, orgId:string, serviceId:string) =>
// this._marketplace.availableChannels(from, serviceId, orgId);

// private async getAvailableChannelInfo (promiEvent:any, orgId:string, serviceId:string, from:string) {
// const availableChannels = (await this.getAvailableChannels(from, orgId, serviceId)).data[0]; //TODO: change to blockchain call

// const recipient = availableChannels.recipient, groupId = availableChannels.groupId;
// const channel = availableChannels.channels[0], endpoint = availableChannels.endpoint[0];

// promiEvent.emit('recipient', recipient);

// return {
//     availableChannels:availableChannels, recipient:recipient, groupId:groupId,
//     channel:channel, endpoint:endpoint
// };
// }
// private async handleChannel (promi, channelInfo:any, opts) {
// if(!channelInfo.channel){
//     const receipt = await this._mpe.openChannel(
//             opts.from, channelInfo.recipient, channelInfo.groupId, opts.amountInCogs,
//             opts.ocExpiration,{from:opts.from});

//     promi.emit('channel_receipt', receipt);

//     return 'TODO';
// } else {
//     return channelInfo.channel;
// }
// }
// private async getChannelState (promi, endpoint, channel, opts) {
// const paymentSvc = await this.service.createChannelStateService(endpoint);
// const signedChannelId = await this.service.signChannelId(channel.channelId, opts.privateKey);
// const channelResponse = await paymentSvc['getChannelState'](signedChannelId);

// const curSignedAmt = parseInt('0x' + 
//     Buffer.from(channelResponse.currentSignedAmount).toString('hex',0,channelResponse.currentSignedAmount.length));

// promi.emit('signedAmt',curSignedAmt);

// return curSignedAmt;
// }
// private async executeService (promi,
// orgId:string, serviceId:string, method:string, request:any,
// channel, endpoint:string, curSignedAmt:number, opts) {

// const svc = await this.service.createService(
//     orgId, serviceId, channel, endpoint, 
//     curSignedAmt,{privateKey:opts.privateKey});

// const response = await svc[method](request);

// promi.emit('response', response);

// return response;
// }