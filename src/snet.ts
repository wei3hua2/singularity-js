/**
 * @module snet
 * @preferred
 * 
 * Main module. To instantiate other model, please use this module.
 */

import {OrganizationSvc} from './impls/organization';
import {AccountSvc} from './impls/account';
import {ServiceSvc} from './impls/service';
import {RunJobOptions} from './models';
import {Utils} from './utils';
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
    protected currentAccount: AccountSvc;
    protected _utils: Utils;
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
            this.currentAccount = await AccountSvc.create(this.web3,{address:this.opts.address, privateKey:this.opts.privateKey});
        else if(this.opts.ethereum)
            this.currentAccount = await AccountSvc.create(this.web3,{ethereum: this.opts.ethereum});
        else
            throw new Error('Init error');

        this.utils = new Utils(this.currentAccount.eth);
        
        return true;
    }

    get utils(): Utils {
        return this._utils;
    }
    set utils(utils:Utils){
        this._utils = utils;
    }
    

    getCurrentAccount(): AccountSvc {
        return this.currentAccount;
    }

    /**
     * List organizations available on the blockchain.
     *
     * @remarks
     * Only id is populated. To get the detail, call the fetch method in [[OrganizationSvc]].
     *
     * @returns A list of organization.
     *
     */
    async listOrganizations(opts:{init:boolean} = {init:false}): Promise<OrganizationSvc[]>{
        return Array.from(await OrganizationSvc.listOrganizations(this.currentAccount, opts));
    }

    /**
     * Get organization instance given an organization Id.
     *
     * @param OrganizationSvc Id. example: snet
     * 
     * @returns OrganizationSvc detail.
     *
     */
    getOrganization(orgId:string, opts:{init:boolean} = {init:true}): Promise<OrganizationSvc> {
        return OrganizationSvc.init(this.currentAccount, orgId, opts);
    }


    /**
     * Get service instance given an organization and service Id.
     *
     * @param orgId example: snet
     * @param serviceId example: example-service
     * 
     * @returns ServiceSvc detail.
     *
     */
    async getService(orgId:string, serviceId:string, opts:{init:boolean} = {init:true}): Promise<ServiceSvc> {
        return ServiceSvc.init(this.currentAccount, orgId, serviceId, opts);
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
        request:any, opts:RunJobOptions= {}): PromiEvent {

        return <PromiEvent>ServiceSvc.init(this.currentAccount, orgId, serviceId).then((svc) => {
            return svc.runJob(method, request, opts);
        });
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
    ethereum?: any;
}

export {
    Snet
};
