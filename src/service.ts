/**
 * @module service
 * @preferred
 * 
 */


import {SnetError} from './errors/snet-error';
import {Model, Fetchable, GrpcModel} from './model';
import * as pb from 'protobufjs';
import {Channel} from './channel';
import {Account} from './account';
import {Ipfs} from './ipfs';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';
//@ts-ignore
import NETWORK from './network.json';

/**
 * To run the service. The logic for execution is from here.
 */
class Service extends GrpcModel implements Fetchable{
    serviceId: string;
    organizationId: string;

    metadata: ServiceMetadata;
    tags: string[];

    jobPromise:PromiEvent<any>;

    isInit: boolean = false;

    /** @ignore*/
    private constructor(account:Account, organizationId:string, serviceId:string, fields?:any) {
        super(account);

        if(!organizationId) throw new SnetError('org_id_svc_not_found', organizationId);
        if(!serviceId) throw new SnetError('service_id_not_found', serviceId);

        this.organizationId = organizationId;
        this.serviceId = serviceId;
    }

    /**
     * Fetch additional data and metadata from the registry and Ipfs.
     */
    public async fetch(): Promise<boolean> {
        if(!this.isInit) {
            const svcReg = await this.getRegistry().getServiceRegistrationById(this.organizationId, this.serviceId);
            this.metadata = await Ipfs.cat(svcReg.metadataURI);
            
            this.tags = svcReg.tags;

            const proto = await this.getServiceProto(this.organizationId, this.serviceId);
            this.processProto(proto);

            this.isInit = true;
        }
        return this.isInit;
    }

    /**
     * List the methods in the protocol buffer.
     * 
     */
    public async listMethods(): Promise<{[method:string]:pb.Method}> {
        if(!this.isInit) await this.fetch();
        return this.ServiceProto.methods;
    }
    public async listTypes(): Promise<{[type:string]:pb.Type}> {
        if(!this.isInit) await this.fetch();

        return this.protoModelArray['Type'].reduce( (result, t) => {
            result[t['name']] = t;
            return result;
        },{});
    }

    public async serviceInfo(opt:{pbField:boolean}={pbField:false}): Promise<ServiceInfo>{
        const methods = await this.listMethods();
        const types = await this.listTypes();
        
        const m = Object.entries(methods).reduce((accum, entry)=> {
            const methodName = entry[0], method = entry[1];
            accum[methodName] = {
                request: {
                    name: method.requestType,
                    fields: this.parseTypeFields(types, method.requestType, opt.pbField)
                },
                response: {
                    name: method.responseType,
                    fields: this.parseTypeFields(types, method.responseType, opt.pbField)
                }
            };
            return accum;
        },{});

        return {
            name: this.ServiceProto.name,
            methods: m
        };
    }

    public async defaultRequest(method: string,opts:pb.IConversionOptions={defaults:true}) {
        const list = await this.listTypes();
        const type = list[this.ServiceProto.methods[method].requestType];

        return type.toObject(type.fromObject({}), opts);
    }

    private parseTypeFields (typeList:any, typeName:string, pbField:boolean): ServiceFieldInfo {
        return Object.entries(typeList[typeName].fields).reduce((accum, entry:any) => {
            const name = entry[0];
            accum[name] = pbField ? 
                entry[1] : {type: entry[1].type, required: entry[1].required, optional: entry[1].optional};
            return accum;
        }, {});
    }

    /**
     * 
     * Job execution. The runner follows the steps:
     * 1. attempt to get available channel. If no channel found, init a new channel.
     * 2. setup protobuf service object.
     * 3. invoke the grpc exposed by the daemon.
     * 
     * 
     * @param method The method name to execute.
     * @param request The payload of the method.
     * @param opts Additional options.
     */
    public runJob(method:string, request:any, opts:any = {}): PromiEvent<any> {
        this.jobPromise = new PromiEvent();
        this.jobPromise.emit(RUN_JOB_STATE.start_job, method, request);

        Channel.getAvailableChannels(this.account, 
            opts.from, this.organizationId, this.serviceId).then(
                (channels) => {
                    this.jobPromise.emit(RUN_JOB_STATE.available_channels, channels);

                    const channel = channels[0];

                    this.jobPromise.emit(RUN_JOB_STATE.selected_channel, channel);

                    return null;
                    // return this.createService(this.jobPromise, channel, {privateKey:opts.privateKey});
            }).then((svc) => {
                this.jobPromise.emit(RUN_JOB_STATE.service_created, svc);

                this.jobPromise.emit(RUN_JOB_STATE.before_execution, method);

                return svc[method](request);
            }).then((response) => {
                this.jobPromise.resolve(response);
            }).catch((err) => {
                this.jobPromise.reject(err);
            });

        return this.jobPromise;
    }
    public openChannel(val:number, opts:any): Promise<any> {
        return Channel.openChannel(
            this.account, opts.from, this.getPaymentAddress(), 
            this.getGroupId(), val, this.getPaymentExpirationThreshold());
    }
    public getGroupId():Uint8Array {
        const hex = this.account._eth.base64ToHex(this.metadata.groups[0].group_id);
        return this.account._eth.hexToBytes(hex);
    }
    public getPaymentAddress() {
        return this.metadata.groups[0].payment_address;
    }
    public getPaymentExpirationThreshold() {
        return this.metadata.payment_expiration_threshold;
    }
    public getEndpoint() {
        return this.metadata.endpoints[0].endpoint;
    }

    protected async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.getEthUtil().getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        return (await axios.get(url)).data;
    }


    // TODO
    // check available channels give: from, organizationId, svcId
    // if not found init one
    // what is the precondition?
    private async retrieveChannel(): Promise<Channel>{
        return null;
    }
    // TODO
    private async invokeAgentService(): Promise<any>{
        return null;
    }

    /**
     * @ignore
     */
    public toString(): string {
        return `\n*** Service ${this.serviceId} :`+
        `\norganizationId: ${this.organizationId}` +
        // `\nmetadataURI: ${this.metadataURI}` +
        `\ntags: ${this.tags}` + 
        `\nmetadata: ${JSON.stringify(this.metadata)}` + 
        `\ninit: ${this.isInit}`;
    }


    private async signServiceHeader (
        channelId:number, nonce:number, priceInCogs:number,
        privateKey:string) {
        const contractAddress = this.account.getMpe().address

        const sha3Message: string = this.getEthUtil().soliditySha3(
            {t: 'address', v: contractAddress}, {t: 'uint256', v: channelId},
            {t: 'uint256', v: nonce}, {t: 'uint256', v: priceInCogs}
          );
      
        const signed = (await this.getEthUtil().sign(sha3Message, {privateKey:privateKey})).signature;
        
        const hexs = this.getEthUtil().bytesToHex(signed);

        return this.getEthUtil().hexToBase64(hexs);
    }
    private parseAgentRequestHeader(signed:string, channel:Channel, priceInCogs:number) {
    
        return {
          'snet-payment-type': 'escrow',
          'snet-payment-channel-id': channel.id,
          'snet-payment-channel-nonce': channel.nonce,
          'snet-payment-channel-amount': priceInCogs,
          'snet-payment-channel-signature-bin': signed
        };
    }

    /**
     * 
     * Initialize a new service object
     * 
     * @param web3 Web3 instance
     * @param serviceId Service ID 
     * @param organizationId Organization Id
     * 
     */
    static async init(account:Account, organizationId:string, serviceId:string, opts:InitOption={}) {
        const svc = new Service(account, organizationId,serviceId);
        if(opts.init) await svc.fetch();

        return svc;
    }
}

class InitOption {
    init?: boolean;
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

/**
 * The list of execution state for running the job.
 */
enum RUN_JOB_STATE {
    start_job = 'start_job',
    available_channels = 'available_channels',
    selected_channel = 'selected_channel',
    service_created = 'service_created',
    before_execution = 'before_execution',
    host = 'host',
    channel_state = 'channel_state',
    price_in_cogs = 'price_in_cogs',
    signed_header = 'signed_header',
    request_header = 'request_header',
    request_info = 'request_info',
    raw_response = 'raw_response'
}

interface RunJobOption {
    from?: string;
    privateKey?: string;
    amountInCogs?:number;
    ocExpiration?:number;
}

interface ServiceFieldInfo {
    [name:string]: {
        type:string;
        required: boolean;
        optional: boolean;
    } | pb.Field;
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

export {Service, RUN_JOB_STATE, RunJobOption, InitOption, ServiceInfo}



    // private async createService (promi:PromiEvent, channel:Channel, opts:any): Promise<any> {
    //     const host:string = this.metadata.endpoints[0].endpoint;
    //     promi.emit(RUN_JOB_STATE.host, host);
        
    //     const channelState = await(channel.getChannelState({privateKey:opts.privateKey}));
    //     promi.emit(RUN_JOB_STATE.channel_state, channelState);

    //     const price_in_cogs = this.metadata.pricing.price_in_cogs + channelState.currentSignedAmount;
    //     promi.emit(RUN_JOB_STATE.price_in_cogs, price_in_cogs);

    //     const signed = await this.signServiceHeader(
    //         channel.id, channel.nonce, price_in_cogs, opts.privateKey);

    //     promi.emit(RUN_JOB_STATE.signed_header, signed);

    //     const requestHeaders = await this.parseAgentRequestHeader(signed, channel, price_in_cogs);
    //     promi.emit(RUN_JOB_STATE.request_header, requestHeaders);

    //     return this.protoService.create(
    //         (method, requestObject, callback) => {
    //             const fullmethod = method.toString().split(' ')[1].trim().substring(1);
    //             const serviceName = fullmethod.split('.')[0] + '.' + fullmethod.split('.')[1];
    //             const methodName = fullmethod.split('.')[2];
                
    //             const headers = Object.assign({}, 
    //                 {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'},
    //                 requestHeaders);

    //             const url = `${host}/${serviceName}/${methodName}`;
    //             const body = this.frameRequest(requestObject);

    //             promi.emit(RUN_JOB_STATE.request_info, headers, url, body);

    //             axios.post(url, body, {headers:headers,responseType:'arraybuffer'})
    //                 .then((response) => {
    //                     promi.emit(RUN_JOB_STATE.raw_response, response);
    //                     this.convertGrpcResponseChunk(response, callback);
    //                 }).catch((err) => { callback(err, null); });
    //         }, false ,false);
    // }