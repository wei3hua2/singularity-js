import {Data} from './index';
import {Channel, Account, RunJobOptions, InitOptions} from '.';
import {ServiceSvc} from '../impls';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';

import {NETWORK} from '../configs/network';

abstract class Service implements Data {
    account: Account;
    id: string;
    organizationId: string;
    metadata?: ServiceMetadata;
    metadataURI?: string
    tags?: string[];

    isInit: boolean = false;
    isMetaInit: boolean = false;
    isProtoInit: boolean = false;

    constructor(account: Account, organizationId:string, serviceId:string, fields?:any) {
        this.account = account;
    }
    
    public abstract init(): Promise<Service>;
    public abstract initMetadata(): Promise<Service>;
    public abstract initProtoBuf(): Promise<Service>;
    public abstract pingDaemonHeartbeat(): Promise<ServiceHeartbeat>;
    public abstract getDaemonEncoding(): Promise<string>;
    public abstract getChannels(opts:{init:boolean}): Promise<Channel[]>;
    
    public abstract get data():Object;
    public abstract set data(data:Object);
    public abstract get groupId():string;
    public abstract get paymentAddress():string;
    public abstract get paymentExpirationThreshold(): number;
    public abstract get endpoint(): string;
    public abstract get price(): number;
    public abstract defaultRequest: (method: string) => Object;
    public abstract info:() => ServiceInfo;

    public abstract runJob(method:string, request:any, channelOrOpts?:Channel|RunJobOptions, opts?:RunJobOptions): PromiEvent<any>;
    public abstract openChannel(amount:number, expiration: number, jobPromi?: PromiEvent): Promise<any>;


    protected DEFAULT_BASIC_OPTS = {
        autohandle_channel: true, autohandle_escrow: false,
        channel_topup_amount: null, channel_min_amount: null,
        channel_topup_expiration: null, channel_min_expiration: null,
        escrow_topup_amount: null, escrow_min_amount: null
    };


    public async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.account.eth.getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        return (await axios.get(url)).data;
    }

    static init(account:Account, 
        organizationId:string, serviceId:string, opts:InitOptions={init: true}): Promise<Service> | Service {

        const svc = new ServiceSvc(account, organizationId,serviceId);
        
        if(opts.init) return svc.init();
        else return svc;
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