import {SnetError, ERROR_CODES} from '../errors/snet-error';
import * as pb from 'protobufjs';
import {ChannelSvc} from './channel';
import {Channel, ChannelState} from '../models/channel';
import {Account} from '../models/account';
import {RunJobOptions, RUN_JOB_STATE, InitOptions} from '../models/options';
import {Service,  
        ServiceHeartbeat, ServiceInfo, ServiceFieldInfo, TopupOptions} from '../models/service';
import axios from 'axios';
import {PromiEvent} from 'web3-core-promievent';


import {Ipfs} from '../utils/ipfs';
import {SvcGrpc} from './service.grpc';
import {SvcRunJob} from './service.runjob';
import {SvcRegistry} from './service.registry';
import {SvcMetadata} from './service.metadata';

class ServiceSvc extends Service implements SvcGrpc, SvcRunJob, SvcRegistry, SvcMetadata {

    constructor(account:Account, organizationId:string, serviceId:string, fields?:any) {
        super(account,organizationId, serviceId, fields);

        this.data = {id: serviceId, organizationId: organizationId};
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
    
    public get data(): Object {
        let d = {id: this.id, organizationId: this.organizationId};
        if(this.isRegistryInit) {
            d = Object.assign(d, {tags: this.tags});
        }
        if(this.isMetaInit) {
            d = Object.assign(d, {
                metadataURI: this.metadataURI, metadata: this.metadata
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

        await this.initRegistry();
        await this.initMetadata();
        await this.initProtoBuf();

        this.isInit = this.isRegistryInit && this.isMetaInit && this.isProtoInit;

        return this;
    }
    
    initMetadata: () => Promise<Service>;

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

    public runJob(method:string, request:any, channelOrOpts?:Channel|RunJobOptions, opts?:RunJobOptions): PromiEvent<any> {
        if(!this.isInit) throw new SnetError(ERROR_CODES.svc_not_init);
        
        const startTime = Date.now();

        const [channel, options] = this.parseChannelAndOptionsOpts(channelOrOpts, opts);
        const jobPromise = new PromiEvent();

        const all_events = this.emitAllEvents(jobPromise);

        this.execJob(jobPromise, method, request, channel, options).then(result => {
            const timeDiff = (Date.now() - startTime) / 1000.0;

            return this.jobSummary(result, all_events, timeDiff);
        }).then(result => {
            jobPromise.emit(RUN_JOB_STATE.stats, result['summary']);

            jobPromise.resolve(result['reply']);
            jobPromise.removeAllListeners();
        }).catch((err) => {
            jobPromise.reject(err);
            jobPromise.removeAllListeners();
        });

        return jobPromise;
    }
    private emitAllEvents(jobPromise): Object {

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
    parseChannelAndOptionsOpts(channelOrOpts:Channel|RunJobOptions, opts?:RunJobOptions): [Channel,RunJobOptions] {
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

    async jobSummary(reply:Object, allEvents: Object, timeTaken:number): Promise<Object> {
        const summary = {};

        let txs = [ allEvents['reply_new_channel'], allEvents['reply_escrow_approve_allowance'],
                    allEvents['reply_escrow_deposit'], allEvents['reply_channel_extend_and_add_funds'],
                    allEvents['reply_channel_add_funds'], allEvents['reply_channel_extend_expiration'] ];
        txs = txs.filter(tx => !!tx);
        txs = txs.map(tx => ({
            method:tx.method,
            gasUsed:tx.receipt.gasUsed, cumulativeGasUsed:tx.receipt.cumulativeGasUsed, 
            transactionHash:tx.receipt.transactionHash, blockNumber:tx.receipt.blockNumber, 
            estmatedGas:tx.transaction.gas, blockHash:tx.receipt.blockHash, 
            gasPrice:tx.transaction.gasPrice, gasLimit:tx.transaction.gasLimit }));
        
            
        summary['txs'] = txs;
        summary['time_taken'] = timeTaken;
        summary['total_tx'] = txs.length;
        summary['total_gas'] = txs.reduce((acc, tx) => acc+ this.account.eth.hexToNumber(tx.gasUsed), 0 );

        const header = allEvents['request_svc_call'].header;
        summary['channel_id'] = header['snet-payment-channel-id'];
        summary['channel_nonce'] = header['snet-payment-channel-nonce'];
        summary['channel_signed_amount'] = header['snet-payment-channel-amount'];

        summary['request'] = allEvents['request_svc_call'].body;
        summary['response'] = allEvents['reply_svc_call'];

        summary['escrow'] = await this.account.getEscrowBalances({inCogs:true});
        summary['agi'] = await this.account.getAgiTokens({inCogs:true});
        
        const channel = await ChannelSvc.retrieve(this.account, summary['channel_id']);
        summary['channel_value'] = channel.value;

        return {reply: reply, summary: summary};
    }


    // method to override for mixin (service.registry)
    initRegistry: () => Promise<Service>;
    openChannel: (amount:number, expiration: number, jobPromi?: PromiEvent) => Promise<any>;
    getChannels: (opts?:InitOptions) => Promise<Channel[]>;


    // method to override for mixin (service.runjob)
    execJob: (jobPromise: PromiEvent<any>, method: string, request: Object, channel: Channel, opts: RunJobOptions) => Promise<Object>;
    resolveChannel: (jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions) => Promise<{isNew:boolean, channel:Channel}>;
    stablizeChannel: (jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions) => Promise<void>;
    serviceCall: (jobPromise:PromiEvent, state:{id:number, nonce:number, signedAmount:number}, method:string, request:Object) => Promise<Object>;
    validateExpirationOpts: (expire:Object, currentBlock:number) => void;
    handleExpirationOpts: (opts: RunJobOptions) => Promise<Object>;
    validateAmountOpts: (amount:Object, signedAmount:number, svcPrice:number) => void;
    handleAmountOpts: (opts: RunJobOptions, channelState:ChannelState) => Promise<Object>;
    validateChannel: (channel:Channel, opts: RunJobOptions) => Promise<any>;
    topupChannel: (validity:Object, channel:Channel, opts: TopupOptions, jobPromise?:PromiEvent) => Promise<any>;
    _findLargestChannel: (channels:Channel[]) => Channel;
    _mapReceiptForEvent: (txResult:{method:string, tx:Object, receipt: Object}) => Object;
    

    // method to override for mixin (service.grpc)
    public initProtoBuf: () => Promise<Service>;
    public defaultRequest: (method: string) => Object;
    public info: () => ServiceInfo;
    
    serviceUrl: (method: pb.Method) => string;
    ServiceProto: pb.Service;
    protoDataTypes: {[type:string]:pb.Type};
    invokeService: (jobPromise, header:Object, method:string, request:Object) => Promise<Object>;
    handleRequestHeader: (channelId:number, nonce:number, signedAmount:number) => Promise<any>;
    signServiceHeader: (channelId:number, nonce:number, priceInCogs:number) => any;
    parseTypeFields: (typeList:any, typeName:string, pbField:boolean) => ServiceFieldInfo;
    initGrpc: (protoJson:Object) => pb.Service;
    createService: (additionalHeaders:any) => pb.rpc.Service;
    getTypes: (protoArray) => {[type:string]:pb.Type};
    convertProtoToArray: (root:pb.NamespaceBase) => {[k:string]:pb.NamespaceBase[]};
    getRootNamespace: (protoJson: Object) => pb.NamespaceBase;
    frameRequest: (bytes:any) => Uint8Array;
    convertGrpcResponseChunk: (response, callback) => void;
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            if(name !== 'constructor')
                derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

applyMixins(ServiceSvc, [SvcGrpc, SvcRunJob, SvcRegistry, SvcMetadata]);


export {ServiceSvc}
