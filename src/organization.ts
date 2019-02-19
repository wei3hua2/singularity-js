/**
 * @module organization
 */

import {Account} from './account';
import {Service} from './service';
// import {Eth} from './eth';
import {Repository} from './repository';
import {Registry} from './contracts/registry';
import {SnetError} from './errors/snet-error';

import {Model, Fetchable} from './model';

class Organization extends Model implements Fetchable{
    name:string;
    owner:Account;
    members:Account[];
    services: Service[];
    repositories: Repository[];
    
    _fetched: boolean;

    constructor(account:Account, fields:any){
        super(account);
        this.populate(fields);
    }

    async fetch(): Promise<boolean> {
        if(!this._fetched) {
            const fields = await this.account.getRegistry().getOrganizationById(this.id);
            this.populate(fields);
        }
        return true;
    }
    private populate (fields:any) : void {
        this.name = fields.name || '';
        this.owner = fields.owner || '';
        // this.members = fields.members ? fields.members.map((memId) => new Account(this.web3,{id:memId})) : [];
        this.services = fields.serviceIds ? fields.serviceIds.map((svcId) => Service.init(this.account, this.id, svcId)) : [];
        // this.repositories = fields.repositoryIds ? fields.repositoryIds.map((repoId) => new Repository(this.web3, {id:repoId})) : [];
    }

    async getService (serviceId: string) : Promise<Service> {
        const svc = Service.init(this.account, this.id, serviceId);
        const ok = await svc.fetch();

        if(!ok) throw new SnetError('fetch_service_error');

        return svc;
    }
    async getServices () : Promise<Service[]> {
        const svcIds:string[] = (await this.account.getRegistry().listServicesForOrganization(this.id)).serviceIds;
        const svcs:Service[] = svcIds.map((id) => Service.init(this.account, id, this.id));

        return svcs;
    }

    static async listOrganizations(account:Account) : Promise<Organization[]> {
        const registry = new Registry(account);
        const orgIds = await registry.listOrganizations();

        return orgIds.map((orgId) => new Organization(account,{id:orgId}));
    }

    static async init(account:Account, id:string) : Promise<Organization> {
        const registry = new Registry(account);
        const regOrg = await registry.getOrganizationById(id);
        
        return new Organization(account, regOrg);
    }
}

export {Organization}