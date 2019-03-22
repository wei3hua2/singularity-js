import {Organization, Account, Service, RunJobOptions, InitOptions} from './models';
import {SnetError, ERROR_CODES} from './errors';
import {Utils} from './utils';
import PromiEvent from 'web3-core-promievent';

class Snet {
    protected isInit: boolean;
    protected web3: any;
    protected currentAccount: Account;
    protected _utils: Utils;
    protected opts:SnetInitOption;

    private constructor(web3:any, opts:SnetInitOption) {
        this.web3 = web3;
        this.opts = opts;
        this.validateWeb3(this.web3);
    }

    async init():Promise<Snet> {
        
        if(this.isInit) return this;

        if(this.opts.privateKey && this.opts.address)
            this.account = await Account.create(this.web3,{address:this.opts.address, privateKey:this.opts.privateKey});
        else if(this.opts.ethereum)
            this.account = await Account.create(this.web3,{ethereum: this.opts.ethereum});
        else
            throw new SnetError(ERROR_CODES.snet_init_params_not_found, this.web3, this.opts);

        this.utils = new Utils(this.account.eth);
        
        return this;
    }

    get utils(): Utils {
        return this._utils;
    }
    set utils(utils:Utils){
        this._utils = utils;
    }
    get account(): Account {
        return this.currentAccount;
    }
    set account(acct: Account){
        this.currentAccount = acct;
    }

    async listOrganizations(opts:InitOptions = {init:false}): Promise<Organization[]>{
        return Array.from(await Organization.listOrganizations(this.account, opts));
    }

    async getOrganization(orgId:string, opts:InitOptions = {init:true}): Promise<Organization> {
        if(opts.init) return await Organization.init(this.account, orgId, opts);
        else return Promise.resolve(Organization.init(this.account, orgId, opts));
    }

    async getService(orgId:string, serviceId:string, opts:{init:boolean} = {init:true}): Promise<Service> {
        if(opts.init) return await Service.init(this.account, orgId, serviceId, opts);
        else return Promise.resolve(Service.init(this.account, orgId, serviceId, opts));
    }

    runJob (orgId:string, serviceId:string, method:string, 
        request:any, opts:RunJobOptions= {}): PromiEvent {

        const service = <PromiEvent>Service.init(this.account, orgId, serviceId);

        return service.then((svc) => {
            return svc.runJob(method, request, opts);
        });
    }

    private validateWeb3(web3) {
        if(!web3)
            throw new SnetError(ERROR_CODES.snet_invalid_web3, 'the web3 object not found');
            
        if(web3.constructor.name !== 'Web3')
            throw new SnetError(ERROR_CODES.snet_invalid_web3, 'the web3 object is invalid');

        if(web3.version && web3.version[0] !== '1')
            throw new SnetError(ERROR_CODES.snet_invalid_web3, 'web3 version must be 1: ' + web3.version);
        
    }


    static async init (web3, opts:SnetInitOption={}): Promise<Snet> {
        const snet = new Snet(web3, opts);
        await snet.init();
        
        return snet;
    }
}

class SnetInitOption {
    address?: string;
    privateKey?: string;
    ethereum?: any;
}

export {
    Snet, SnetInitOption
};
