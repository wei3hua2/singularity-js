/**
 * @module Organization
 */

import {Account} from './account';
import {Service} from './service';
import {Tokens} from './contracts/tokens';
import {Marketplace} from './marketplace';
import {Repository} from './repository';
import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {SnetError} from './errors/snet-error';

import {CoreModel} from './core-model';

class Organization extends CoreModel{
    name:string;
    owner:Account;
    members:Account[];
    services: Service[];
    repositories: Repository[];

    private marketplace: Marketplace;
    private _tokens: Tokens;
    
    constructor(registry:Registry, mpe:Mpe, tokens:Tokens, marketplace:Marketplace, fields:any){
        super(registry, mpe, fields);
        this.marketplace = marketplace;
        this._tokens = tokens;

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
        this.members = fields.members ? fields.members.map((memId) => new Account(this._registry,this._mpe, this._tokens,{id:memId})) : [];
        this.services = fields.serviceIds ? fields.serviceIds.map((svcId) => new Service(this._registry,this._mpe, this.marketplace, {id:svcId}, this.id)) : [];
        this.repositories = fields.repositoryIds ? fields.repositoryIds.map((repoId) => new Repository(this._registry,this._mpe, {id:repoId})) : [];
    }

    async getService (serviceId: string) : Promise<Service> {
        const svc = new Service(this._registry, this._mpe, this.marketplace, {id:serviceId}, this.id);
        const ok = await svc.fetch();

        if(!ok) throw new SnetError('fetch_service_error');

        return svc;
    }
    async getServices () : Promise<Service[]> {
        const svcIds:string[] = (await this._registry.listServicesForOrganization(this.id)).serviceIds;
        const svcs:Service[] = svcIds.map((id) => Service.getById(this._registry, this._mpe, this.marketplace,id, this.id));

        return svcs;
    }

    static async listOrganizations(registry:Registry, mpe:Mpe, marketplace:Marketplace, tokens:Tokens) : Promise<Organization[]> {
        const orgIds = await registry.listOrganizations();
        return orgIds.map((orgId) => new Organization(registry, mpe,tokens, marketplace,{id:orgId}));
    }
    static async getById(registry:Registry, mpe:Mpe, marketplace:Marketplace, tokens:Tokens, id:string) : Promise<Organization> {
        const regOrg = await registry.getOrganizationById(id);
        
        return new Organization(registry, mpe, tokens, marketplace, regOrg);
    }
}

export {Organization}