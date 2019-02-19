/**
 * @module service
 * @preferred
 * 
 */


import {SnetError} from './errors/snet-error';
import {Model} from './model';
import * as pb from 'protobufjs';
import {Channel} from './channel';
import {Ipfs} from './ipfs';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';
import {processProtoToArray, getServiceProto, frameRequest, convertGrpcResponseChunk} from './utils/grpc';

/**
 * To run the service. The logic for execution is from here.
 */
class Service extends Model{
    orgId: string;
    metadataURI: string;
    metadata: ServiceMetadata;
    protoService: pb.Service;
    tags: string[];
    private protoBuf: any;

    jobPromise:PromiEvent<any>;

    /** @ignore*/
    private constructor(web3, orgId:string, fields:any) {
        super(web3, fields);

        if(!orgId) throw new SnetError('org_id_svc_not_found', orgId);
        this.orgId = orgId;
    }

    /**
     * Fetch additional data and metadata from the registry and Ipfs.
     */
    public async fetch(): Promise<boolean> {
        console.log('fetched : '+this._fetched);

        if(!this._fetched) {
            const svcReg = await this._registry.getServiceRegistrationById(this.orgId, this.id);
            const metadata = await Ipfs.cat(svcReg.metadataURI);
            const proto = await getServiceProto(this._eth, this.orgId, this.id);
            
            this.metadataURI = svcReg.metadataURI;
            this.tags = svcReg.tags;
            this.metadata = metadata;
            this.protoBuf = processProtoToArray(proto);
            this.protoService = this.protoBuf['Service'][0];
            
            this._fetched = true;
        }
        return this._fetched;
    }

    /**
     * List the methods in the protocol buffer.
     * 
     */
    public async listMethods(): Promise<{[method:string]:pb.Method}> {
        if(!this._fetched) await this.fetch();

        return this.protoService.methods;
    }

    /**
     * 
     * Job execution
     * 
     * @param method The method name to execute.
     * @param request The payload of the method.
     * @param opts Additional options.
     */
    public runJob(method:string, request:any, opts:any = {}): PromiEvent<any> {
        this.jobPromise = new PromiEvent();
        this.jobPromise.emit(RUN_JOB_STATE.start_job, method, request);

        Channel.getAvailableChannels(this.web3, 
            opts.from, this.orgId, this.id).then(
                (channels) => {
                    this.jobPromise.emit(RUN_JOB_STATE.available_channels, channels);

                    const channel = channels[0];

                    this.jobPromise.emit(RUN_JOB_STATE.selected_channel, channel);

                    return this.createService(this.jobPromise, channel, {privateKey:opts.privateKey});
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

    /**
     * @ignore
     */
    public toString(): string {
        return `\n*** Service ${this.id} :`+
        `\norgId: ${this.orgId}` +
        `\nmetadataURI: ${this.metadataURI}` +
        `\ntags: ${this.tags}` + 
        `\nmetadata: ${JSON.stringify(this.metadata)}` + 
        `\nproto: ${this.protoBuf}`;
    }

    private async createService (promi:PromiEvent, channel:Channel, opts:any): Promise<any> {
        const host:string = this.metadata.endpoints[0].endpoint;
        promi.emit(RUN_JOB_STATE.host, host);
        
        const channelState = await(channel.initChannelState().getChannelState({privateKey:opts.privateKey}));
        promi.emit(RUN_JOB_STATE.channel_state, channelState);

        const price_in_cogs = this.metadata.pricing.price_in_cogs + channelState.currentSignedAmount;
        promi.emit(RUN_JOB_STATE.price_in_cogs, price_in_cogs);

        const signed = await this.signServiceHeader(
            channel.id, channel.nonce, price_in_cogs, opts.privateKey);

        promi.emit(RUN_JOB_STATE.signed_header, signed);

        const requestHeaders = await this.parseAgentRequestHeader(signed, channel, price_in_cogs);
        promi.emit(RUN_JOB_STATE.request_header, requestHeaders);

        return this.protoService.create(
            (method, requestObject, callback) => {
                const fullmethod = method.toString().split(' ')[1].trim().substring(1);
                const serviceName = fullmethod.split('.')[0] + '.' + fullmethod.split('.')[1];
                const methodName = fullmethod.split('.')[2];
                
                const headers = Object.assign({}, 
                    {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'},
                    requestHeaders);

                const url = `${host}/${serviceName}/${methodName}`;
                const body = frameRequest(requestObject);

                promi.emit(RUN_JOB_STATE.request_info, headers, url, body);

                axios.post(url, body, {headers:headers,responseType:'arraybuffer'})
                    .then((response) => {
                        promi.emit(RUN_JOB_STATE.raw_response, response);
                        convertGrpcResponseChunk(response, callback);
                    }).catch((err) => { callback(err, null); });
            }, false ,false);
    }

    private async signServiceHeader (
        channelId:number, nonce:number, priceInCogs:number,
        privateKey:string) {
        const contractAddress = await this._mpe.getNetworkAddress();

        const sha3Message: string = this._eth.soliditySha3(
            {t: 'address', v: contractAddress}, {t: 'uint256', v: channelId},
            {t: 'uint256', v: nonce}, {t: 'uint256', v: priceInCogs}
          );
      
        const signed = (await this._eth.sign(sha3Message, {privateKey:privateKey})).signature;

        const stripped = signed.substring(2, signed.length);
        const byteSig = global.Buffer.from(stripped, 'hex');
        const buff = new global.Buffer(byteSig);

        return buff.toString('base64');
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
    static init(web3:any, organizationId:string, serviceId:string) {
        return new Service(web3, organizationId, {id:serviceId});
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

export {Service, RUN_JOB_STATE, RunJobOption}