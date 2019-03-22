/**
 * @module service
 * @preferred
 * 
 */

import {SnetError, ERROR_CODES} from '../errors/snet-error';
import * as pb from 'protobufjs';
import {ChannelSvc} from './channel';
import {Channel, ChannelState} from '../models/channel';
import {Account} from '../models/account';
import {RunJobOptions, RUN_JOB_STATE} from '../models/options';
import {Service,  
        ServiceHeartbeat, ServiceInfo, ServiceFieldInfo} from '../models/service';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';

import {Buffer} from 'buffer';
import {Ipfs} from '../utils/ipfs';
import {SvcGrpc} from './service.grpc';
import {SvcRunJob} from './service.runjob';

class ServiceSvc extends Service implements SvcGrpc, SvcRunJob {

    constructor(account:Account, organizationId:string, serviceId:string, fields?:any) {
        super(account,organizationId, serviceId, fields);

        this.data = {id: serviceId, organizationId: organizationId};
    }

    public async openChannel(amount:number, expiration: number, jobPromi?: PromiEvent): Promise<any> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);

        if(jobPromi) jobPromi.emit(RUN_JOB_STATE.request_new_channel, [this.account.address, this.paymentAddress, this.groupId, amount, expiration]);
        
        const channel = await ChannelSvc.openChannel(
            this.account, this.account.address, this.paymentAddress, 
            this.groupId, amount, expiration);
        
        channel['endpoint'] = this.endpoint;
        
        if(jobPromi) jobPromi.emit(RUN_JOB_STATE.reply_new_channel, channel.data);

        return channel;
    }
    public async getChannels(opts:{init:boolean}={init:false}): Promise<Channel[]> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);

        const sender = this.account.address, recipient = this.paymentAddress, groupId = this.groupId;

        const channels:ChannelSvc[] = await this.account.getChannels(
            {filter: {recipient: recipient, sender: sender, groupId: groupId}}, opts);

        channels.forEach(c => { c.endpoint = this.metadata.endpoints[0].endpoint });

        return Array.from(channels);
    }
    public async pingDaemonHeartbeat(): Promise<ServiceHeartbeat> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);

        const response = await axios.get(this.endpoint+'/heartbeat');
        const result = response.data;
        const heartbeat:ServiceHeartbeat = Object.assign({}, result, {timestamp: parseInt(result.timestamp)});

        return heartbeat;
    }
    public async getDaemonEncoding(): Promise<string> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);

        const response = await axios.get(this.endpoint+'/encoding');
        return response.data;
    }
    
    public get groupId ():string {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        return this.metadata.groups[0].group_id;
    }
    public get paymentAddress():string {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        return this.metadata.groups[0].payment_address;
    }
    public get paymentExpirationThreshold () {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        return this.metadata.payment_expiration_threshold;
    }
    public get endpoint () {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        return this.metadata.endpoints[0].endpoint;
    }
    public get price () {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        return this.metadata.pricing.price_in_cogs;
    }
    public get data(): Object {
        let d = {id: this.id, organizationId: this.organizationId};
        if(this.isInit) {
            d = Object.assign(d, {
                metadataURI: this.metadataURI, metadata: this.metadata, tags: this.tags
            });
        }
        return d;
    }
    public set data(data: Object) {
        this.id = data['id'] || this.id; 
        this.organizationId = data['organizationId'] || this.organizationId;
        this.metadata = data['metadata'] || this.metadata;
        this.metadataURI = data['metadataURI'] || this.metadataURI;
        this.tags = data['tags'] || this.tags;
    }
    public async init(): Promise<Service> {
        if(this.isInit) return this;

        const svcReg = await this.account.registry.getServiceRegistrationById(this.organizationId, this.id);

        this.data = {tags: svcReg.tags, metadataURI: svcReg.metadataURI};

        await this.initMetadata();
        await this.initProtoBuf();

        this.isInit = this.isMetaInit && this.isProtoInit;

        return this;
    }
    public async initMetadata(): Promise<Service> {
        if(!this.isMetaInit) {
            const metadata = await Ipfs.cat(this.metadataURI);
            this.data = {metadata: metadata};
        }

        this.isMetaInit = true;

        return this;
    }
    public async initProtoBuf(): Promise<Service> {
        if(!this.isProtoInit) {
            const proto = await this.getServiceProto(this.organizationId, this.id);
            this.initGrpc(proto);
        }

        this.isProtoInit = true;

        return this;
    }


    async invokeService(jobPromise, header:Object, method:string, request:Object): Promise<Object> {
        try{
            const svc = await this.createService(header);
            const result = await svc[method](request);

            return result;

        }catch(err){
            throw new SnetError(ERROR_CODES.runjob_svc_call_error, method, request, err.message);
        }
    }
    async handleRequestHeader(channelId:number, nonce:number, signedAmount:number): Promise<any> {
        const header = {
            channelId: channelId, nonce: nonce || 0, price_in_cogs: this.price + (signedAmount || 0)
        };

        const signed = await this.signServiceHeader(header.channelId, header.nonce, header.price_in_cogs);
        const grpcHeader = {
            'snet-payment-type': 'escrow', 
            'snet-payment-channel-id': header.channelId, 'snet-payment-channel-nonce': header.nonce,
            'snet-payment-channel-amount': header.price_in_cogs, 'snet-payment-channel-signature-bin': signed
        };

        return grpcHeader;
    }
    async signServiceHeader (
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
    async topupEscrow(jobPromise:PromiEvent, opts: {min_amount:number, topup_amount}, autohandleEscrow:boolean): Promise<any> {

        const escrowBalance = await this.account.getEscrowBalances({inCogs:true});

        this.validateEscrowAmountOpts(opts, autohandleEscrow, escrowBalance, 0, this.price);

        const minAmount = opts.min_amount, topupAmount = opts.topup_amount;

        const allowance = await this.account.escrowAllowance({inCogs:true});

        if(allowance < topupAmount){
            if(jobPromise) jobPromise.emit(RUN_JOB_STATE.request_escrow_approve_allowance, 
                {allowance:allowance, topupAmount:topupAmount});

            const approveReceipt = await this.account.approveEscrow(topupAmount,{inCogs:true});

            if(jobPromise) jobPromise.emit(RUN_JOB_STATE.reply_escrow_approve_allowance, 
                this.mapReceiptForEvent(approveReceipt));
        } 
        

        if(jobPromise) jobPromise.emit(RUN_JOB_STATE.request_escrow_deposit, topupAmount);

        const receipt = await this.account.depositToEscrow(topupAmount, {inCogs: true});

        if(jobPromise) jobPromise.emit(RUN_JOB_STATE.reply_escrow_deposit, this.mapReceiptForEvent(receipt));

        return this.mapReceiptForEvent(receipt);
    }
    async topupChannel (jobPromise, validity:Object, channel:Channel, opts: RunJobOptions): Promise<any> {
        
        if(opts.autohandle_escrow) await this.topupEscrow(jobPromise, 
            {min_amount: opts.escrow_min_amount, topup_amount: opts.escrow_topup_amount},opts.autohandle_escrow);
        
        let receipt;
        if(validity['channel_lessthan_topup_amount'] && validity['channel_lessthan_topup_expiration']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_and_add_funds, 
                {   channel: channel.data, expiration: validity['channel_lessthan_topup_expiration'][1], amount: amount });

            receipt = await channel.extendAndAddFunds(validity['channel_lessthan_topup_expiration'][1], amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_and_add_funds, this.mapReceiptForEvent(receipt));
        }
        else if(validity['channel_lessthan_topup_amount']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_add_funds, {channel:channel.data, amount: amount});

            receipt = await channel.channelAddFunds(amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_add_funds, this.mapReceiptForEvent(receipt));
        }
        else if(validity['channel_lessthan_topup_expiration']) {
            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_expiration,
                {channel:channel.data, expiration:validity['channel_lessthan_topup_expiration'][1]});

            receipt = await channel.channelExtend(validity['channel_lessthan_topup_expiration'][1]);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_expiration, this.mapReceiptForEvent(receipt));
        }
    }

    mapReceiptForEvent(txResult:{method:string, tx:Object, receipt: Object}): Object {
        const receipt = Object.assign({}, txResult.receipt);
        delete receipt['logs'];
        delete receipt['logsBloom'];

        return {method: txResult.method, transaction: txResult.tx ? txResult.tx['transaction'] : null, receipt: receipt};
    }


    
    public runJob(method:string, request:any, channelOrOpts?:Channel|RunJobOptions, opts?:RunJobOptions): PromiEvent<any> {
        if(!this.isInit) throw new SnetError(ERROR_CODES.svc_not_init);
        
        const startTime = Date.now();

        const [channel, options] = this.resolveChannelAndOptions(channelOrOpts, opts);
        const jobPromise = new PromiEvent();

        const all_events = this.emitAllEvents(jobPromise);

        this.__runJob(startTime, all_events, jobPromise, method, request, channel, options).then(result => {
            jobPromise.resolve(result);
            jobPromise.removeAllListeners();
        }).catch((err) => {
            jobPromise.reject(err);
            jobPromise.removeAllListeners();
        });

        return jobPromise;
    }
    resolveChannelAndOptions(channelOrOpts:Channel|RunJobOptions, opts?:RunJobOptions): [Channel,RunJobOptions] {
        let channel = null, options = {};

        if(channelOrOpts instanceof Channel) {
            channel = channelOrOpts;
            options = opts || {};
            channel.endpoint = this.endpoint;
        }
        else options = channelOrOpts || {};
        
        options = Object.assign({}, this.DEFAULT_BASIC_OPTS, options);
            
        return [channel, options];
    }
    emitAllEvents(jobPromise): Object {

        const data = Object.keys(RUN_JOB_STATE).reduce((acc, state) => {
            if(state === 'stats' || state === 'debug_update_options') return acc;

            let d = {}; d[state] = null;
            return Object.assign({}, acc, d);
        },{});

        Object.keys(RUN_JOB_STATE).forEach( key => {
            if(key !== 'stats' && key !== 'debug_update_options')
                jobPromise.on(key, d => {
                    data[key] = d;
                    jobPromise.emit('all_events', JSON.parse(JSON.stringify([key, data])));
                });
        });

        return data;
    }

    // method to override for mixin
    __runJob: (startTime:number, all_events:Object, jobPromise: PromiEvent<any>, method: string, request: Object, channel: Channel, opts: RunJobOptions) => Promise<Object>;
    _runJobResolveChannel: (jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions) => Promise<{isNew:boolean, channel:Channel}>;
    _runJobStablizeChannel: (jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions) => Promise<void>;
    _runJobServiceCall: (jobPromise:PromiEvent, state:{id:number, nonce:number, signedAmount:number}, method:string, request:Object) => Promise<Object>;
    jobSummary: (allEvents: Object, timeTaken:number) => Promise<Object>;
    validateExpirationOpts: (expire:Object, currentBlock:number) => void;
    handleExpirationOpts: (opts: RunJobOptions) => Promise<Object>;
    validateChannel: (channel:Channel, opts: RunJobOptions) => Promise<any>;
    findLargestChannel: (channels:Channel[]) => Channel;
    handleAmountOpts: (opts: RunJobOptions, channelState:ChannelState) => Promise<Object>;
    validateAmountOpts: (amount:Object, signedAmount:number, svcPrice:number) => void;
    validateEscrowAmountOpts: (amount:{min_amount:number, topup_amount:number}, autohandleEscrow:boolean, escrowBalance:number, signedAmount:number, svcPrice:number) => void;

    



    // method to override for mixin
    public ServiceProto: pb.Service;
    public protoDataTypes: {[type:string]:pb.Type};
    public defaultRequest: (method: string) => Object;
    public serviceUrl: (method: pb.Method) => string;
    parseTypeFields: (typeList:any, typeName:string, pbField:boolean) => ServiceFieldInfo;
    initGrpc: (protoJson:Object) => pb.Service;
    createService: (additionalHeaders:any) => pb.rpc.Service;
    getTypes: (protoArray) => {[type:string]:pb.Type};
    convertProtoToArray: (root:pb.NamespaceBase) => {[k:string]:pb.NamespaceBase[]};
    getRootNamespace: (protoJson: Object) => pb.NamespaceBase;
    frameRequest: (bytes:any) => Uint8Array;
    convertGrpcResponseChunk: (response, callback) => void;
    info: () => ServiceInfo;
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if(name !== 'constructor')
                derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

applyMixins(ServiceSvc, [SvcGrpc, SvcRunJob]);


export {ServiceSvc}
