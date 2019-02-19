/**
 * @module organization
 */

import {Account} from './account';
import {Service} from './service';
import {Eth} from './eth';
import {Repository} from './repository';
import {Registry} from './contracts/registry';
import {SnetError} from './errors/snet-error';

import {Model} from './model';

class Organization extends Model{
    name:string;
    owner:Account;
    members:Account[];
    services: Service[];
    repositories: Repository[];
    
    constructor(web3:any, fields:any){
        super(web3, fields);
        this.populate(fields);
    }

    async fetch(): Promise<boolean> {
        if(!this._fetched) {
            const fields = await this._registry.getOrganizationById(this.id);
            this.populate(fields);
        }
        return true;
    }
    private populate (fields:any) : void {
        this.name = fields.name || '';
        this.owner = fields.owner || '';
        this.members = fields.members ? fields.members.map((memId) => new Account(this.web3,{id:memId})) : [];
        this.services = fields.serviceIds ? fields.serviceIds.map((svcId) => Service.init(this.web3, this.id, svcId)) : [];
        this.repositories = fields.repositoryIds ? fields.repositoryIds.map((repoId) => new Repository(this.web3, {id:repoId})) : [];
    }

    async getService (serviceId: string) : Promise<Service> {
        const svc = Service.init(this.web3, this.id, serviceId);
        const ok = await svc.fetch();

        if(!ok) throw new SnetError('fetch_service_error');

        return svc;
    }
    async getServices () : Promise<Service[]> {
        const svcIds:string[] = (await this._registry.listServicesForOrganization(this.id)).serviceIds;
        const svcs:Service[] = svcIds.map((id) => Service.init(this.web3, id, this.id));

        return svcs;
    }

    static async listOrganizations(web3:any) : Promise<Organization[]> {
        const registry = new Registry(new Eth(web3));
        const orgIds = await registry.listOrganizations();

        return orgIds.map((orgId) => new Organization(web3,{id:orgId}));
    }

    static async init(web3:any, id:string) : Promise<Organization> {
        const registry = new Registry(new Eth(web3));
        const regOrg = await registry.getOrganizationById(id);
        
        return new Organization(web3, regOrg);
    }
}

export {Organization}