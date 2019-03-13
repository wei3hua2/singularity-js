import {Data} from './index';
import {Account} from './account';
import {Ipfs} from '../utils/ipfs';
import {Grpc} from './grpc';
import axios from 'axios';

import {NETWORK} from '../configs/network';

abstract class Service extends Grpc implements Data {
    id: string;
    organizationId: string;
    metadata: ServiceMetadata;
    tags: string[];

    isInit: boolean = false;

    constructor(account: Account, organizationId:string, serviceId:string, fields?:any) {
        super(account);
        this.data = {id: serviceId, organizationId: organizationId};
    }

    get data() {
        let d = {id: this.id, organizationId: this.organizationId};
        if(this.isInit) {
            d = Object.assign(d, {
                metadata: this.metadata, tags: this.tags
            });
        }
        return d;
    }
    set data(data: Object) {
        this.id = data['id'] || this.id; 
        this.organizationId = data['organizationId'] || this.organizationId;
        this.metadata = data['metadata'] || this.metadata;
        this.tags = data['tags'] || this.tags;
    }

    async init(): Promise<any> {
        if(this.isInit) return this;

        const svcReg = await this.account.registry.getServiceRegistrationById(this.organizationId, this.id);

        this.data = {tags: svcReg.tags, metadata: await Ipfs.cat(svcReg.metadataURI)};

        this.processProto(await this.getServiceProto(this.organizationId, this.id));

        this.isInit = true;

        return this;
    }

    protected async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.account.eth.getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        return (await axios.get(url)).data;
    }
}

/**
 * The structure of service_metadata.json file
 */
interface ServiceMetadata {
    version: number;
    display_name: string;
    encoding: string;
    service_type: string;
    payment_expiration_threshold: number;
    model_ipfs_hash: string;
    mpe_address: string;
    pricing: {
        price_model: string,
        price_in_cogs: number
    },
    groups: {
        group_name: string,
        group_id: string,
        payment_address: string
    }[],
    endpoints: {
        group_name: string,
        endpoint: string
    }[],
    service_description: {
        description: string,
        url: string
    }
}

interface ServiceFieldInfo {
    [name:string]: {
        type:string;
        required: boolean;
        optional: boolean;
    };
}

interface ServiceInfo {
    name: string;
    methods: {
        [method:string]: {
            request: {
                name: string;
                fields: ServiceFieldInfo
            }
            response: {
                name: string;
                fields: ServiceFieldInfo
            }
        }
    }
}

interface ServiceHeartbeat {
    daemonID: string;
    timestamp: number;
    status: string;
    serviceheartbeat: {
        serviceID: string;
        status: string;
    }
}

export {Service, ServiceMetadata, ServiceFieldInfo, ServiceInfo, ServiceHeartbeat}