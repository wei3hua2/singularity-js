/**
 * @module organization
 */

 import * as BbPromise from 'bluebird';
// import {AccountSvc} from './account';
import {ServiceSvc} from './service';
import {Organization, Account, Service} from '../models';
import {SnetError} from '../errors/snet-error';


class OrganizationSvc extends Organization {

    constructor(account:Account, id:string,  fields?:any){
        super(account, id, fields);
    }

    async getService (serviceId: string) : Promise<ServiceSvc> {
        const svc = await ServiceSvc.init(this.account, this.id, serviceId);

        return svc;
    }
    async getServices (opts:InitOption={init:false}) : Promise<ServiceSvc[]> {
        const svcIds:string[] = (await this.account.registry.listServicesForOrganization(this.id)).serviceIds;
        
        return await BbPromise.map(svcIds, (svcId) => ServiceSvc.init(this.account, this.id, svcId, opts));
    }

    public toString () : string {
        return 'id : '+this.id+' , name : '+this.name+' , init : '+this.isInit;
    }

    static async listOrganizations(account:Account, opts:InitOption={}) : Promise<OrganizationSvc[]> {
        const orgIds = await account.registry.listOrganizations();

        const orgs = orgIds.map((orgId) => new OrganizationSvc(account,orgId));

        if(opts.init) await BbPromise.each(orgs, (org) => org.init());

        return orgs;
    }

    static async init(account:Account, id:string, opts:InitOption={}) : Promise<OrganizationSvc> {
        const regOrg = await account.registry.getOrganizationById(id);
        const org = new OrganizationSvc(account, id, regOrg);

        if(opts.init) await org.init();

        return org;
    }
}

class InitOption {
    init?: boolean;
}

export {OrganizationSvc, InitOption}