/**
 * @module organization
 */

 import * as BbPromise from 'bluebird';
import {Organization, Account, Service, InitOptions} from '../models';
import {SnetError} from '../errors/snet-error';

class OrganizationSvc extends Organization {

    constructor(account:Account, id:string,  fields?:any){
        super(account, id, fields);
        this.account = account;
        this.data = Object.assign({}, fields, {id: id});
    }

    async init(): Promise<Organization> {
        if(this.isInit) return this;
        
        const fields = await this.account.registry.getOrganizationById(this.id);
        this.data = fields;
        this.isInit = true;
        
        return this;
    }

    set data(data: Object) {
        this.id = data['id'] || this.id;
        this.owner = data['owner'] || this.owner;
        this.name = data['name'] || this.name;
        this.members = data['members'] || this.members;

        const svcs = data['serviceIds'] ? 
            data['serviceIds'].map((svcId) => Service.init(this.account, this.id, svcId, {init:false})) : [];
        this.services = svcs || this.services;
    }
    get data(): Object {
        let d = {id: this.id};

        if(this.isInit) d = Object.assign(d, {
            name: this.name, owner: this.owner, members: this.members, services: this.services.map(s => s.data)}
        );
        return d;
    }

    async getService (serviceId: string) : Promise<Service> {
        const svc = await Service.init(this.account, this.id, serviceId);
        return svc;
    }
    async getServices (opts:InitOptions={init:false}) : Promise<Service[]> {
        const svcIds:string[] = (await this.account.registry.listServicesForOrganization(this.id)).serviceIds;
        return await BbPromise.map(svcIds, (svcId) => Service.init(this.account, this.id, svcId, opts));
    }
}

export {OrganizationSvc}