/**
 * @module service
 * @preferred
 * 
 */

import {SnetError, ERROR_CODE} from '../errors/snet-error';
import * as pb from 'protobufjs';
import {ChannelSvc} from './channel';
import {ServiceMetadata, Service, Channel, Account, InitOptions, 
    ServiceHeartbeat, RunJobOptions, RUN_JOB_STATE, ServiceInfo, ServiceFieldInfo} from '../models';
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
    private listTypes = (): {[type:string]:pb.Type} => this.dataTypesProto;
    
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

    public async pingDaemonHeartbeat(): Promise<ServiceHeartbeat> {
        const response = await axios.get(this.getEndpoint()+'/heartbeat');
        const result = response.data;
        const heartbeat:ServiceHeartbeat = Object.assign({}, result, {timestamp: parseInt(result.timestamp)});

        return heartbeat;
    }

    public async getDaemonEncoding(): Promise<string> {
        const response = await axios.get(this.getEndpoint()+'/encoding');
        return response.data;
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

    private DEFAULT_BASIC_OPTS = {
        autohandle_channel: true, skip_validation: false, 
        channel_topup_amount: null, channel_min_amount: null,
        channel_topup_expiration: null, channel_min_expiration: null};

    /**
     * 
     */
    public runJob(method:string, request:any, channelOrOpts?:Channel|RunJobOptions, opts?:RunJobOptions): PromiEvent<any> {
        const {channel, options} = this.resolveChannelAndOptions(channelOrOpts, opts);
        
        const jobPromise = new PromiEvent();

        this.emitAllEvents(jobPromise);

        this._runJob(jobPromise, method, request, channel, options).then(result => {
            jobPromise.resolve(result);
            jobPromise.removeAllListeners();
        }).catch((err) => {
            jobPromise.reject(err);
            jobPromise.removeAllListeners();
        });

        return jobPromise;
    }

    private emitAllEvents(jobPromise) {

        const data = {
            available_channels: null,
            create_new_channel: null,
            channel_extend_and_add_funds: null,
            channel_add_funds: null, 
            channel_extend_expiration: null,
            selected_channel: null,
            sign_channel_state: null,
            channel_state: null,
            sign_request_header: null,
            request_info: null,
            response: null
        };

        jobPromise.on('available_channels', d => {
            data.available_channels = d;
            jobPromise.emit('all_events', ['available_channels', data]);
        });
        jobPromise.on('create_new_channel', d => {
            data.create_new_channel = d;
            jobPromise.emit('all_events', ['create_new_channel',data]);
        });
        jobPromise.on('channel_extend_and_add_funds', d => {
            data.channel_extend_and_add_funds = d;
            jobPromise.emit('all_events', ['channel_extend_and_add_funds',data]);
        });
        jobPromise.on('channel_add_funds', d => {
            data.channel_add_funds = d;
            jobPromise.emit('all_events', ['channel_add_funds',data]);
        });
        jobPromise.on('channel_extend_expiration', d => {
            data.channel_extend_expiration = d;
            jobPromise.emit('all_events', ['channel_extend_expiration',data]);
        });
        jobPromise.on('selected_channel', d => {
            data.selected_channel = d;
            jobPromise.emit('all_events', ['selected_channel',data]);
        });
        jobPromise.on('sign_channel_state', d => {
            data.sign_channel_state = d;
            jobPromise.emit('all_events', ['sign_channel_state',data]);
        });
        jobPromise.on('channel_state', d => {
            data.channel_state = d;
            jobPromise.emit('all_events', ['channel_state',data]);
        });
        jobPromise.on('sign_request_header', d => {
            data.sign_request_header = d;
            jobPromise.emit('all_events', ['sign_request_header',data]);
        });
        jobPromise.on('request_info', d => {
            data.request_info = d;
            jobPromise.emit('all_events', ['request_info',data]);
        });
        jobPromise.on('response', d => {
            data.response = d;
            jobPromise.emit('all_events', ['response',data]);
        });
    }

    private resolveChannelAndOptions(channelOrOpts:Channel|RunJobOptions, opts?:RunJobOptions) {
        let channel = null, options = {};

        if(channelOrOpts instanceof Channel) {
            channel = channelOrOpts;
            options = opts || {};
        }
        else options = channelOrOpts || {};
        
        options = Object.assign({}, this.DEFAULT_BASIC_OPTS, options);

        return {channel, options};
    }

    // required validation:
    // escrow amount >= sigedAmount + unit price
    // expiration >= currentBlockNo + threshold + 3 mins (channel_min_expiration)
    private async _runJob(jobPromise: PromiEvent<any>, 
        method: string, request: Object, channel: Channel, opts: RunJobOptions): Promise<Object> {

        let _newOpenChannel: boolean = false;
        channel = await this.resolveExistingChannel(jobPromise, channel);

        opts = Object.assign({}, opts, await this.handleExpirationOpts(opts));
        

        if(channel){}
        else if(opts.autohandle_channel) {
            channel = await this.openChannel(jobPromise, opts.channel_topup_amount, opts.channel_topup_expiration);
            _newOpenChannel = true;
        }
        else throw new SnetError(ERROR_CODE.runjob_condition_not_meet, {});

        jobPromise.emit(RUN_JOB_STATE.selected_channel, channel.data);


        const state = await channel.getChannelState(jobPromise);

        jobPromise.emit(RUN_JOB_STATE.channel_state, state.data);

        let validity = {};
        if(!_newOpenChannel) {
            opts = Object.assign({}, opts, await this.handleAmountOpts(opts, state));
            validity = await this.validateChannel(channel, opts);
        }
        
        if(opts.autohandle_channel) {
            await this.topupChannel(jobPromise, validity, channel, opts);
        }

        const grpcHeader = await this.handleRequestHeader(
            jobPromise, channel.id, channel.nonce, state.currentSignedAmount);
        
        jobPromise.emit(RUN_JOB_STATE.request_info, request);

        return await this.invokeService(jobPromise, grpcHeader, method, request);
    }

    private async invokeService(jobPromise, header:Object, method:string, request:Object): Promise<Object> {
        try{
            const svc = await this.createService(header);
            const result = await svc[method](request);

            jobPromise.emit(RUN_JOB_STATE.response, result);  // state: response

            return result;

        }catch(err){
            throw new SnetError(ERROR_CODE.grpc_call_error, method, request, err.message);
        }
    }

    private async handleRequestHeader(jobPromise, channelId:number, nonce:number, signedAmount:number): Promise<any> {
        const header = {
            channelId: channelId, 
            nonce: nonce || 0, 
            price_in_cogs: this.getPrice() + (signedAmount || 0)
        };

        jobPromise.emit(RUN_JOB_STATE.sign_request_header, header);  // state: sign_request_header

        const signed = await this.signServiceHeader(header.channelId, header.nonce, header.price_in_cogs);
        const grpcHeader = {
            'snet-payment-type': 'escrow', 
            'snet-payment-channel-id': header.channelId, 'snet-payment-channel-nonce': header.nonce,
            'snet-payment-channel-amount': header.price_in_cogs, 'snet-payment-channel-signature-bin': signed
        };

        return grpcHeader
    }

    private async topupChannel (jobPromise, validity:Object, channel:Channel, opts: RunJobOptions): Promise<any> {
        if(validity['channel_lessthan_topup_amount'] && validity['channel_lessthan_topup_expiration']) {
            channel = await channel.extendAndAddFunds(
                validity['channel_lessthan_topup_expiration'][1], validity['channel_lessthan_topup_amount'][1]);

            jobPromise.emit(RUN_JOB_STATE.channel_extend_and_add_funds, channel.data);  // state: channel_extend_and_add_funds
        }
        else if(validity['channel_lessthan_topup_amount']) {
            channel = await channel.channelAddFunds(validity['channel_lessthan_topup_amount'][1]);

            jobPromise.emit(RUN_JOB_STATE.channel_add_funds, channel.data);  // state: channel_add_funds
        }
        else if(validity['channel_lessthan_topup_expiration']) {
            channel = await channel.channelExtend(validity['channel_lessthan_topup_expiration'][1]);

            jobPromise.emit(RUN_JOB_STATE.channel_extend_expiration, channel.data);  // state: channel_extend_expiration
        }
    }

    private async handleExpirationOpts (opts: RunJobOptions): Promise<Object> {
        const result = {
            channel_topup_expiration: opts.channel_topup_expiration,
            channel_min_expiration: opts.channel_min_expiration
        };

        if(opts.channel_topup_expiration && opts.channel_min_expiration) return result;
        
        const currentBlockNo = await this.account.eth.getBlockNumber();

        if(!opts.channel_topup_expiration) 
            result.channel_topup_expiration = currentBlockNo + this.getPaymentExpirationThreshold() + CONFIG.EXPIRATION_BLOCK_TOPUP_OFFSET;

        if(!opts.channel_min_expiration) 
            result.channel_min_expiration = currentBlockNo + this.getPaymentExpirationThreshold() + CONFIG.EXPIRATION_BLOCK_MIN_OFFSET;

        return result;
    }

    private async handleAmountOpts(opts: RunJobOptions, channelState:any): Promise<Object> {
        const result = {channel_topup_amount: opts.channel_topup_amount,channel_min_amount: opts.channel_min_amount};
        
        if(opts.channel_topup_amount && opts.channel_min_amount) return result;

        const signedAmount = channelState.currentSignedAmount || 0;

        if(!opts.channel_topup_amount) 
            result.channel_topup_amount = signedAmount  + this.getPrice();

        if(!opts.channel_min_amount)
            result.channel_min_amount = signedAmount + this.getPrice();

        return result;
    }

    private async resolveExistingChannel(jobPromise, channel: Channel): Promise<Channel> {
        let result = channel;

        if(!result) {
            const channels = await this.getChannels();
            jobPromise.emit(RUN_JOB_STATE.available_channels, channels.map(c => c.data));

            result = this.findLargestChannel(channels);
        }

        if(result)
            await result.init();

        return result;
    }

    private async validateChannel(channel:Channel, opts: RunJobOptions): Promise<any> {
        const validity = {};
        const escrowAmount = await this.account.getEscrowBalances();

        if(escrowAmount < opts.channel_topup_amount)
            validity['not_enough_in_escrow'] = [escrowAmount, opts.channel_topup_amount];

        if(channel.value < opts.channel_topup_amount)
            validity['channel_lessthan_topup_amount'] = [channel.value, opts.channel_topup_amount];

        if(channel.expiration < opts.channel_topup_expiration)
            validity['channel_lessthan_topup_expiration'] = [channel.expiration, opts.channel_topup_expiration];

        return validity;
    }

    private findLargestChannel(channels:Channel[]): Channel {
        let channel = null;

        if(!channels || channels.length === 0) return channel;
        else if(channels.length > 0) {
            channel = channels.reduce((acc, c) => {
                if(c.id > acc.id) return c;
                else return acc;
            }, channels[0]);
        }

        return channel;
    }

    public async openChannel(jobPromi: PromiEvent, amount:number, expiration: number): Promise<any> {
        const channel = await ChannelSvc.openChannel(
            this.account, this.account.address, this.getPaymentAddress(), 
            this.getGroupId(), amount, expiration);
        
        channel['endpoint'] = this.metadata.endpoints[0].endpoint;
        
        if(jobPromi) jobPromi.emit(RUN_JOB_STATE.create_new_channel, channel.data);

        return channel;
    }

    public async getChannels(filter:{id?:number}={}): Promise<Channel[]> {
        const recipient = this.account.address, sender = this.getPaymentAddress(), groupId = this.getGroupId();

        const openChannelsEvents = await this.account.getChannels(
            {filter: {recipient: sender, sender: recipient, groupId: groupId}}
        );
        
        const openChannels:ChannelSvc[] = openChannelsEvents.map((c) => {
            c['endpoint'] = this.metadata.endpoints[0].endpoint;
            return ChannelSvc.init(this.account, c['id'], c);
        });

        return Array.from(openChannels);
    }


    public getGroupId = ():string => this.metadata.groups[0].group_id
    public getPaymentAddress = ():string => this.metadata.groups[0].payment_address;
    public getPaymentExpirationThreshold = () => this.metadata.payment_expiration_threshold;
    public getEndpoint = () => this.metadata.endpoints[0].endpoint;
    public getPrice = () => this.metadata.pricing.price_in_cogs;
    

    protected async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.account.eth.getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        return (await axios.get(url)).data;
    }

    protected serviceUrl(method: pb.Method): string {
        const serviceName = this.ServiceProto.parent.name ? 
            this.ServiceProto.parent.name+'.'+this.ServiceProto.name : this.ServiceProto.name;
        
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
