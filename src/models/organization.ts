import {Data} from './index';
import {Account, Service, InitOptions, SvcInitOptions} from '.';
import {OrganizationSvc} from '../impls';
import * as BbPromise from 'bluebird';

abstract class Organization implements Data {
    id:string;
    name?:string;
    owner?:Account;
    members?:Account[];
    services?: Service[];

    isInit: boolean = false;

    account: Account;

    constructor(account:Account, id: string, fields:any= {}) {}

    public abstract init(): Promise<Organization>;
    public abstract get data():Object;
    public abstract set data(data:Object);
    public abstract getService (serviceId: string, opts?:SvcInitOptions) : Promise<Service>;
    public abstract getServices (opts:SvcInitOptions) : Promise<Service[]>;


    static init(account:Account, id:string, opts:InitOptions={}) : Promise<Organization> | Organization {
        const org = new OrganizationSvc(account, id, {});

        if(opts.init) return org.init();
        else return org;
    }

    static async listOrganizations(account:Account, opts:InitOptions={}) : Promise<Organization[]> {
        const orgIds = await account.registry.listOrganizations();

        const orgs = orgIds.map((orgId) => new OrganizationSvc(account,orgId));

        if(opts.init) await BbPromise.each(orgs, (org) => org.init());

        return orgs;
    }
}

export {Organization}