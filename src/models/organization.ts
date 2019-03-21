import {Data} from './index';
import {ServiceSvc} from '../impls/service';
import {Account} from './account';
import {Service} from './service';
import * as BbPromise from 'bluebird';

abstract class Organization implements Data {
    id:string;
    name?:string;
    owner?:Account;
    members?:Account[];
    services?: Service[];

    isInit: boolean = false;

    account: Account;

    constructor(account:Account, id: string, fields:any= {}) {
        this.account = account;
        this.data = Object.assign({}, fields, {id: id});
    }

    set data(data: Object) {
        this.id = data['id'] || this.id;
        this.owner = data['owner'] || this.owner;
        this.name = data['name'] || this.name;
        this.members = data['members'] || this.members;

        const svcs = data['serviceIds'] ? 
            data['serviceIds'].map((svcId) => ServiceSvc.init(this.account, this.id, svcId, {init:false})) : [];
        this.services = svcs || this.services;
    }

    get data(): Object {
        let d = {id: this.id};

        if(this.isInit) d = Object.assign(d, {
            name: this.name, owner: this.owner, members: this.members, services: this.services}
        );
        return d;
    }

    async init(): Promise<any> {
        if(this.isInit) return this;
        
        const fields = await this.account.registry.getOrganizationById(this.id);
        this.data = fields;
        this.isInit = true;
        
        return this;
    }
}

export {Organization}