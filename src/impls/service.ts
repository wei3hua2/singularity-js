/**
 * @module service
 * @preferred
 * 
 */

import {SnetError, ERROR_CODE} from '../errors/snet-error';
import * as pb from 'protobufjs';
import {ChannelSvc} from './channel';
import {ServiceMetadata, Service, Channel, Account, InitOptions, ChannelState,
    ServiceHeartbeat, RunJobOptions, RUN_JOB_STATE, ServiceInfo, ServiceFieldInfo} from '../models';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';
//@ts-ignore
import {NETWORK} from '../configs/network';
import {CONFIG} from '../configs/config';

import {Logger} from '../utils/logger';

const log = Logger.logger();

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

    private DEFAULT_BASIC_OPTS() {
        return {
            autohandle_channel: true, autohandle_escrow: true,
            channel_topup_amount: null, channel_min_amount: null,
            channel_topup_expiration: null, channel_min_expiration: null,
            escrow_topup_amount: null, escrow_min_amount: null};
    }


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

        const data = Object.keys(RUN_JOB_STATE).reduce((acc, state) => {
            let d = {}; d[state] = null;
            return Object.assign({}, acc, d);
        },{});

        Object.keys(RUN_JOB_STATE).forEach( key => {
            jobPromise.on(key, d => {
                data[key] = d;
                jobPromise.emit('all_events', JSON.parse(JSON.stringify([key, data])));
            });    
        });
    }

    private resolveChannelAndOptions(channelOrOpts:Channel|RunJobOptions, opts?:RunJobOptions) {
        let channel = null, options = {};

        if(channelOrOpts instanceof Channel) {
            channel = channelOrOpts;
            options = opts || {};
        }
        else options = channelOrOpts || {};
        
        options = Object.assign({}, this.DEFAULT_BASIC_OPTS(), options);
        
        channel.endpoint = this.getEndpoint();

        return {channel, options};
    }

    private async _runJob(jobPromise: PromiEvent<any>, 
        method: string, request: Object, channel: Channel, opts: RunJobOptions): Promise<Object> {

        let _newOpenChannel: boolean = false;

        channel = await this.resolveExistingChannel(jobPromise, channel);

        opts = Object.assign({}, opts, await this.handleExpirationOpts(opts));
        
        if(opts.autohandle_channel && !channel) {
            channel = await this.openChannel(jobPromise, this.getPrice(), opts.channel_topup_expiration);
            _newOpenChannel = true;
        }
        else if(!opts.autohandle_channel && !channel) throw new SnetError(ERROR_CODE.runjob_no_channel_found, {});

        await channel.init();
        
        jobPromise.emit(RUN_JOB_STATE.resolved_channel, channel.data);


        const channelState = await channel.getChannelState(jobPromise); 
        jobPromise.emit(RUN_JOB_STATE.reply_channel_state, channelState.data);

        let validity = {};
        
        if(!_newOpenChannel) {
            opts = Object.assign({}, opts, await this.handleAmountOpts(opts, channelState));
            validity = await this.validateChannel(channel, opts);
            jobPromise.emit(RUN_JOB_STATE.checked_channel_validity, {options:opts, validity:validity});

            if(opts.autohandle_channel) 
                await this.topupChannel(jobPromise, validity, channel, opts);
            else
                throw new SnetError(ERROR_CODE.runjob_insufficient_fund_expiration, validity);
        }
        
        
        const grpcHeader = await this.handleRequestHeader(channel.id, channelState.currentNonce, channelState.currentSignedAmount);
        
        jobPromise.emit(RUN_JOB_STATE.request_svc_call, {header: grpcHeader, body: request});

        return await this.invokeService(jobPromise, grpcHeader, method, request);
    }

    private async invokeService(jobPromise, header:Object, method:string, request:Object): Promise<Object> {
        try{
            const svc = await this.createService(header);
            const result = await svc[method](request);

            jobPromise.emit(RUN_JOB_STATE.reply_svc_call, result);

            return result;

        }catch(err){
            throw new SnetError(ERROR_CODE.runjob_svc_call_error, method, request, err.message);
        }
    }

    private async handleRequestHeader(channelId:number, nonce:number, signedAmount:number): Promise<any> {
        const header = {
            channelId: channelId, nonce: nonce || 0, price_in_cogs: this.getPrice() + (signedAmount || 0)
        };

        const signed = await this.signServiceHeader(header.channelId, header.nonce, header.price_in_cogs);
        const grpcHeader = {
            'snet-payment-type': 'escrow', 
            'snet-payment-channel-id': header.channelId, 'snet-payment-channel-nonce': header.nonce,
            'snet-payment-channel-amount': header.price_in_cogs, 'snet-payment-channel-signature-bin': signed
        };

        return grpcHeader;
    }

    private async topupChannel (jobPromise, validity:Object, channel:Channel, opts: RunJobOptions): Promise<any> {
        let receipt;
        if(validity['channel_lessthan_topup_amount'] && validity['channel_lessthan_topup_expiration']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_and_add_funds, 
                {   channel: channel.data, expiration: validity['channel_lessthan_topup_expiration'][1], amount: amount });

            receipt = await channel.extendAndAddFunds(validity['channel_lessthan_topup_expiration'][1], amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_and_add_funds, receipt.transactionHash);
        }
        else if(validity['channel_lessthan_topup_amount']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_add_funds, {channel:channel.data, amount: amount});

            receipt = await channel.channelAddFunds(amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_add_funds, receipt.transactionHash);
        }
        else if(validity['channel_lessthan_topup_expiration']) {
            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_expiration,
                {channel:channel.data, expiration:validity['channel_lessthan_topup_expiration'][1]});

            receipt = await channel.channelExtend(validity['channel_lessthan_topup_expiration'][1]);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_expiration, receipt.transactionHash);
        }
    }

    /**
     * Service called: eth.getBlockNumber()
     */
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

    private async handleAmountOpts(opts: RunJobOptions, channelState:ChannelState): Promise<Object> {
        const result = {
            channel_topup_amount: opts.channel_topup_amount, channel_min_amount: opts.channel_min_amount};
        
        if(opts.channel_topup_amount && opts.channel_min_amount) return result;

        const signedAmount = channelState.currentSignedAmount || 0;

        if(!opts.channel_topup_amount) 
            result.channel_topup_amount = signedAmount  + this.getPrice();

        if(!opts.channel_min_amount)
            result.channel_min_amount = signedAmount + this.getPrice();

        return result;
    }

    private async resolveExistingChannel(jobPromise, channel: Channel): Promise<Channel> {
        jobPromise.emit(RUN_JOB_STATE.request_available_channels, true);
        const channels = await this.getChannels();
        jobPromise.emit(RUN_JOB_STATE.reply_available_channels, channels.map(c => c.data));
        
        let result = channel;

        if(!result) 
            result = this.findLargestChannel(channels);

        else if(!channels.some(c => result.id === c.id))
            throw new SnetError(ERROR_CODE.runjob_no_channel_found, result.id);
            

        return result;
    }

    private async validateChannel(channel:Channel, opts: RunJobOptions): Promise<any> {
        const validity = {};
        // const escrowAmount = await this.account.getEscrowBalances({inCogs:true});

        // if(escrowAmount < opts.escrow_min_amount)
        //     validity['not_enough_in_escrow'] = [escrowAmount, opts.escrow_topup_amount];

        if(channel.value < opts.channel_min_amount)
            validity['channel_lessthan_topup_amount'] = [channel.value, opts.channel_topup_amount];

        if(channel.expiration < opts.channel_min_expiration)
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

    public async openChannel(amount:number, expiration: number, jobPromi?: PromiEvent): Promise<any> {
        if(jobPromi) jobPromi.emit(RUN_JOB_STATE.request_new_channel, [this.account.address, this.getPaymentAddress(), this.getGroupId(), amount, expiration]);
        
        const channel = await ChannelSvc.openChannel(
            this.account, this.account.address, this.getPaymentAddress(), 
            this.getGroupId(), amount, expiration);
        
        channel['endpoint'] = this.getEndpoint();
        
        if(jobPromi) jobPromi.emit(RUN_JOB_STATE.reply_new_channel, channel.data);

        return channel;
    }

    public async getChannels(opts:{init:boolean}={init:false}): Promise<Channel[]> {
        const sender = this.account.address, recipient = this.getPaymentAddress(), groupId = this.getGroupId();

        const channels:ChannelSvc[] = await this.account.getChannels(
            {filter: {recipient: recipient, sender: sender, groupId: groupId}}, opts);

        channels.forEach(c => { c.endpoint = this.metadata.endpoints[0].endpoint });

        return Array.from(channels);
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

        log.debug(`ServiceSvc: netId ${netId}, network ${network}, url ${url}`);
    
        const result = (await axios.get(url)).data;

        return result;
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


    static async init(account:Account, 
        organizationId:string, serviceId:string, opts:InitOptions={init: true}) {

        const svc = new ServiceSvc(account, organizationId,serviceId);
        if(opts.init) await svc.init();

        return svc;
    }
}

export {ServiceSvc}
