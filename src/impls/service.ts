/**
 * @module service
 * @preferred
 * 
 */

import {SnetError, ERROR_CODE} from '../errors/snet-error';
import * as pb from 'protobufjs';
import {ChannelSvc} from './channel';
import {ServiceMetadata, Service, Channel, Account, InitOptions, 
    RunJobOptions, RUN_JOB_STATE, ServiceInfo, ServiceFieldInfo} from '../models';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';
//@ts-ignore
import {NETWORK} from '../configs/network';
import {CONFIG} from '../configs/config';


/**
 * To run the service. The logic for execution is from here.
 */
class ServiceSvc extends Service {
    serviceId: string;
    organizationId: string;

    metadata: ServiceMetadata;
    tags: string[];

    isInit: boolean = false;

    /** @ignore*/
    private constructor(account:Account, organizationId:string, serviceId:string, fields?:any) {
        super(account,organizationId, serviceId, fields);

        if(!organizationId) throw new SnetError('org_id_svc_not_found', organizationId);
        if(!serviceId) throw new SnetError('service_id_not_found', serviceId);
    }

    /**
     * List the methods in the protocol buffer.
     * 
     */
    private listMethods = (): {[method:string]:pb.Method} => this.ServiceProto.methods;
    private listTypes = (): {[type:string]:pb.Type} => this.TypesProto;
    
    public info(opt:{pbField:boolean}={pbField:false}): ServiceInfo{
        if(!this.isInit) return null;
        
        const methods = this.listMethods();
        const types = this.listTypes();
        
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

    public defaultRequest(method: string,opts:pb.IConversionOptions={defaults:true}) {
        const list = this.listTypes();
        const type = list[this.ServiceProto.methods[method].requestType];

        return type.toObject(type.fromObject({}), opts);
    }

    private parseTypeFields (typeList:any, typeName:string, pbField:boolean): ServiceFieldInfo {
        return Object.entries(typeList[typeName].fields).reduce((accum, entry:any) => {
            const name = entry[0], type = entry[1].type;
            let val = entry[1].defaultValue;
            
            if(val === null || val === undefined) {
                if(type === 'bytes' || type === 'string') val = '';
                else val = 0;
            }

            accum[name] = pbField ? 
                entry[1] : {
                    type: type, required: entry[1].required, 
                    optional: entry[1].optional, value: val};
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
    public runJob(method:string, request:any, opts:RunJobOptions = {
        autohandle_channel: true, channel_min_amount: 1, channel_min_expiration: null, use_channel_id: null}): PromiEvent<any> {

        const jobPromise = new PromiEvent();

        this.account.eth.getBlockNumber().then((blockNo) => {
            if(!opts.channel_min_expiration)
                opts.channel_min_expiration = blockNo + this.getPaymentExpirationThreshold() + CONFIG.EXPIRATION_BLOCK_OFFSET;
        
            return this.getChannel(jobPromise, this.account.address, opts);
        }).then((channel) => {
            const conditions = this.checkCriteria(channel, opts.channel_min_amount, opts.channel_min_expiration);

            if(!conditions) 
                return Promise.resolve(channel);
            else if(opts.autohandle_channel) 
                return this.autoHandleChannel(jobPromise, channel, conditions);
            else
                throw new SnetError(ERROR_CODE.runjob_condition_not_meet, conditions, channel);

        }).then((channel) => {
            
            jobPromise.emit(RUN_JOB_STATE.selected_channel, channel.data);

            return this.invokeAgentService(jobPromise, channel, method, request);
            
        }).then((response) => {

            jobPromise.emit(RUN_JOB_STATE.response, response);
            
            jobPromise.resolve(response);

        }).catch((err) => jobPromise.reject(err));

        return jobPromise;
    }

    private async getChannel(jobPromi: PromiEvent, 
        address: string, opts: RunJobOptions): Promise<Channel> {

        const use_channel_id = opts.use_channel_id, min_amount = opts.channel_min_amount, min_expiration = opts.channel_min_expiration;
        const channels = await this.getChannels();

        jobPromi.emit(RUN_JOB_STATE.available_channels, channels.map(c => c.data));

        let channel;

        if(use_channel_id)
            channel = channels.find((c) => c.id === use_channel_id);
        else {
            channel = channels.find((c) => min_amount >= c.value && min_expiration >= c.expiration);

            if(!channel && channels.length > 0) channel = channels[0];
        }

        if(channel) await channel.init();

        return channel;
    }

    private checkCriteria(channel: Channel, 
        min_amount: number, min_expiration: number): Object {
        const conditions = {};

        if(min_amount < channel.value) conditions['min_amount'] = min_amount;
        if(min_expiration > channel.expiration) conditions['min_expiration'] = min_expiration;

        return Object.keys(conditions).length > 0 ? conditions : null;
    }

    private async autoHandleChannel(jobPromi: PromiEvent, channel: Channel, conditions: Object): Promise<Channel> {
        let result_channel;

        if(!channel){
            result_channel = await this.openChannel(conditions['min_amount'], conditions['min_expiration']);
            jobPromi.emit(RUN_JOB_STATE.create_new_channel, result_channel.data);
        }
        else if(conditions['min_amount'] && conditions['min_expiration']) {
            result_channel = await channel.extendAndAddFunds(conditions['min_expiration'], conditions['min_amount']);
            jobPromi.emit(RUN_JOB_STATE.channel_extend_and_add_funds, result_channel.data);
        }
        else if(conditions['min_amount']) {
            result_channel = await channel.channelAddFunds(conditions['min_amount']);
            jobPromi.emit(RUN_JOB_STATE.channel_add_funds, result_channel.data);
        }
        else if(conditions['min_expiration']) {
            result_channel = await channel.channelExtend(conditions['min_expiration']);
            jobPromi.emit(RUN_JOB_STATE.channel_extend_expiration, result_channel.data);
        }

        await channel.init();

        return channel;
    }

    public async openChannel(amount:number, expiration: number): Promise<any> {
        return await ChannelSvc.openChannel(
            this.account, this.account.address, this.getPaymentAddress(), 
            this.getGroupId(), amount, expiration);
    }

    public async getChannels(filter:{id?:number}={}): Promise<Channel[]> {
        const recipient = this.account.address, sender = this.getPaymentAddress(), groupId = this.getGroupId();

        const openChannelsEvents = await this.account.getChannels(
            {filter: {recipient: sender, sender: recipient, groupId: groupId}}
        );
        
        const openChannels:ChannelSvc[] = openChannelsEvents.map((c) => {
            c['value'] = c['amount'];
            c['endpoint'] = this.metadata.endpoints[0].endpoint;
            delete c['amount'];
            return ChannelSvc.init(this.account, c['id'], c);
        });

        return Array.from(openChannels);
    }


    public getGroupId = ():string => this.metadata.groups[0].group_id
    public getPaymentAddress = ():string => this.metadata.groups[0].payment_address;
    public getPaymentExpirationThreshold = () => this.metadata.payment_expiration_threshold;
    public getEndpoint = () => this.metadata.endpoints[0].endpoint;
    

    protected async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.account.eth.getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        return (await axios.get(url)).data;
    }
    
    private async invokeAgentService(promi:PromiEvent, channel:Channel, method:string, request:any): Promise<any>{
        
        const state = await channel.getChannelState(promi);

        promi.emit(RUN_JOB_STATE.channel_state, state.data);
        
        const nonce = channel.nonce || 0;
        const price_in_cogs = this.metadata.pricing.price_in_cogs + (state.currentSignedAmount || 0);

        promi.emit(RUN_JOB_STATE.sign_request_header, {channelId: channel.id, nonce: nonce, price: price_in_cogs});

        const signed = await this.signServiceHeader(channel.id, nonce, price_in_cogs);
        const header = await this.parseAgentRequestHeader(signed, channel.id, nonce, price_in_cogs);

        const svc = await this.createService(header);

        promi.emit(RUN_JOB_STATE.request_info, request);

        let response;
        try{
            response = await svc[method](request);
        }catch(err){
            throw new SnetError(ERROR_CODE.grpc_call_error, method, request, err.message);
        }

        return response;
    }

    protected serviceUrl(method: pb.Method): string {
        const serviceName = this.ServiceProto.parent.name+'.'+this.ServiceProto.name;
        return `${this.getEndpoint()}/${serviceName}/${method.name}`;
    }

    /**
     * @ignore
     */
    public toString(): string {
        return `\n*** ServiceSvc ${this.serviceId} :`+
        `\norganizationId: ${this.organizationId}` +
        // `\nmetadataURI: ${this.metadataURI}` +
        `\ntags: ${this.tags}` + 
        `\nmetadata: ${JSON.stringify(this.metadata)}` + 
        `\ninit: ${this.isInit}`;
    }


    private async signServiceHeader (
        channelId:number, nonce:number, priceInCogs:number) {
        const contractAddress = this.account.mpe.address
        const opts = {
            privateKey: this.account.privateKey,
            address: this.account.address};

        const sha3Message: string = this.account.eth.soliditySha3(
            {t: 'address', v: contractAddress}, {t: 'uint256', v: channelId},
            {t: 'uint256', v: nonce}, {t: 'uint256', v: priceInCogs}
          );
      
        const signedPayload = await this.account.eth.sign(sha3Message, opts);
        const signed = signedPayload.signature ? signedPayload.signature : signedPayload;

        var stripped = signed.substring(2, signed.length)
        var byteSig = Buffer.from(stripped, 'hex');
        let buff = new Buffer(byteSig);
        let base64data = buff.toString('base64');

        return base64data;
    }
    private parseAgentRequestHeader(signed:string, channelId:number, nonce:number, priceInCogs:number) {
    
        return {
          'snet-payment-type': 'escrow',
          'snet-payment-channel-id': channelId,
          'snet-payment-channel-nonce': nonce,
          'snet-payment-channel-amount': priceInCogs,
          'snet-payment-channel-signature-bin': signed
        };
    }

    /**
     * 
     * Initialize a new service object
     * 
     * @param web3 Web3 instance
     * @param serviceId ServiceSvc ID 
     * @param organizationId OrganizationSvc Id
     * 
     */
    static async init(account:Account, 
        organizationId:string, serviceId:string, opts:InitOptions={init: true}) {

        const svc = new ServiceSvc(account, organizationId,serviceId);
        if(opts.init) await svc.init();

        return svc;
    }
}

export {ServiceSvc}
