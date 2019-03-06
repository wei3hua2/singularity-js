import {Data} from './index';
import {Service} from './service';
import {Account} from './account';

abstract class Organization implements Data {
    id:string;
    name:string;
    owner:Account;
    members:Account[];
    services: Service[];

    isInit: boolean = false;

    account: Account;

    constructor(account:Account, id: string, fields:any= {}) {
        this.account = account;
        this.data = Object.assign({}, fields, {id: id});
    }

    set data(data: Object) {
        // this.services = fields.serviceIds ? fields.serviceIds.map((svcId) => ServiceSvc.init(this.account, this.id, svcId)) : [];

        this.id = data['id'] || this.id;
        this.owner = data['owner'] || this.owner;
        this.name = data['name'] || this.name;
        this.members = data['members'] || this.members;
        this.services = data['services'] || this.services;
    }

    get data(): Object {
        return {
            id: this.id, name: this.name, owner: this.owner,
            members: this.members, services: this.services
        };
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