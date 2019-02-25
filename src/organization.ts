/**
 * @module organization
 */

 import * as BbPromise from 'bluebird';
import {Account} from './account';
import {Service} from './service';
import {Repository} from './repository';
import {SnetError} from './errors/snet-error';

import {Model, Fetchable} from './model';

class Organization extends Model implements Fetchable{
    id:string;
    name:string;
    owner:Account;
    members:Account[];
    services: Service[];
    repositories: Repository[];
    
    isInit: boolean = false;

    constructor(account:Account, id:string,  fields?:any){
        super(account);
        this.id = id;
        if(fields) this.populate(fields);
    }

    async fetch(): Promise<boolean> {
        if(!this.isInit) {
            const fields = await this.account.getRegistry().getOrganizationById(this.id);
            this.populate(fields);
        }
        return this.isInit;
    }
    private populate (fields:any) : void {
        this.name = fields.name || '';
        this.owner = fields.owner || '';
        // this.members = fields.members ? fields.members.map((memId) => new Account(this.web3,{id:memId})) : [];
        this.services = fields.serviceIds ? fields.serviceIds.map((svcId) => Service.init(this.account, this.id, svcId)) : [];
        // this.repositories = fields.repositoryIds ? fields.repositoryIds.map((repoId) => new Repository(this.web3, {id:repoId})) : [];
        this.isInit = true;
    }

    async getService (serviceId: string) : Promise<Service> {
        const svc = await Service.init(this.account, this.id, serviceId);
        const ok = await svc.fetch();

        if(!ok) throw new SnetError('fetch_service_error');

        return svc;
    }
    async getServices (opts:InitOption={init:false}) : Promise<Service[]> {
        const svcIds:string[] = (await this.account.getRegistry().listServicesForOrganization(this.id)).serviceIds;
        
        return await BbPromise.map(svcIds, (svcId) => Service.init(this.account, this.id, svcId, opts));
    }

    public toString () : string {
        return 'id : '+this.id+' , name : '+this.name+' , init : '+this.isInit;
    }

    static async listOrganizations(account:Account, opts:InitOption={}) : Promise<Organization[]> {
        const registry = account.getRegistry();
        const orgIds = await registry.listOrganizations();

        const orgs = orgIds.map((orgId) => new Organization(account,orgId));

        if(opts.init) await BbPromise.each(orgs, (org) => org.fetch());

        return orgs;
    }

    static async init(account:Account, id:string, opts:InitOption={}) : Promise<Organization> {
        const registry = account.getRegistry();
        const regOrg = await registry.getOrganizationById(id);
        const org = new Organization(account, id, regOrg);

        if(opts.init) await org.fetch();

        return org;
    }
}

class InitOption {
    init?: boolean;
}

export {Organization, InitOption}