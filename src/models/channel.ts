import {Data, Account, RUN_JOB_STATE} from '.';
import {Grpc} from './grpc';
import {SERVICE_STATE_JSON} from '../configs/service_state_json';
import {PromiEvent} from 'web3-core-promievent';

abstract class Channel implements Data {
    id:number;
    nonce: number;
    sender: string;
    signer: string;
    recipient: string;
    groupId: string;
    value: number;
    expiration: number;

    balance_in_cogs?: number;
    pending?: number;
    endpoint?: string;

    isInit: boolean;

    account: Account;

    constructor(account:Account, id: number, fields?:any) {
        this.data = Object.assign({}, fields, {id: id});
        this.account = account;
    }

    set data (data: Object) {
        this.id = data['id'] || this.id;
        this.nonce = data['nonce'] || this.nonce;
        this.sender = data['sender'] || this.sender;
        this.signer = data['signer'] || this.signer;
        this.recipient = data['recipient'] || this.recipient;
        this.groupId = data['groupId'] || this.groupId;
        this.value = data['value'] || this.value;
        this.expiration = data['expiration'] || this.expiration;

        this.balance_in_cogs = data['balance_in_cogs'] || this.balance_in_cogs;
        this.pending = data['pending'] || this.pending;
        this.endpoint = data['endpoint'] || this.endpoint;
    }
    get data () {
        const d = {};
        
        if(this.id) d['id'] = this.id;
        if(this.sender) d['sender'] = this.sender;
        if(this.signer) d['signer'] = this.signer;
        if(this.recipient) d['recipient'] = this.recipient;
        if(this.groupId) d['groupId'] = this.groupId;
        if(this.value) d['value'] = this.value;
        if(this.expiration) d['expiration'] = this.expiration;
        if(this.balance_in_cogs) d['balance_in_cogs'] = this.balance_in_cogs;
        if(this.pending) d['pending'] = this.pending;
        if(this.endpoint) d['endpoint'] = this.endpoint;

        return d;
    }

    async init(): Promise<Channel> {
        if(this.isInit) return this;

        const channel = await this.account.mpe.channels(this.id);
        this.data = channel;
        this.isInit = true;

        return this;
    }

    abstract getChannelState(promi?:PromiEvent): Promise<ChannelState>;

    abstract extendAndAddFunds(newExpiration:number, amount:number): Promise<any>;
    abstract channelAddFunds(value:number):Promise<any>;
    abstract channelExtend(expiration:number):Promise<any>;
}

abstract class ChannelState extends Grpc implements Data {
    endpoint:string;
    channelId: number;
    currentSignature: string;
    currentNonce: number;
    currentSignedAmount: number;
    account: Account;

    isInit: boolean = false;

    constructor(account:Account, endpoint:string, channelId:number) {
      super();
      this.endpoint = endpoint;
      this.channelId = channelId;
      this.account = account;
    }

    abstract set data(data: Object);
    abstract get data();
    abstract signChannelId(promi?: PromiEvent): Promise<Uint8Array>;

    async init(promi?: PromiEvent): Promise<ChannelState> {
      if(this.isInit) return this;

      this.initGrpc(SERVICE_STATE_JSON);

      const byteschannelID = this.account.eth.numberToBytes(this.channelId, 4);
      const byteSig:Uint8Array = await this.signChannelId(promi);
      const request = {"channelId":byteschannelID, "signature":byteSig};

      if(promi) promi.emit(RUN_JOB_STATE.request_channel_state, request);
      
      const channelResponse = await this.createService()['getChannelState'](request);

      this.data = {
          currentNonce: this.account.eth.bytesToNumber(channelResponse.currentNonce), 
          currentSignedAmount: parseInt(this.account.eth.bytesToHex(channelResponse.currentSignedAmount))
      };

      this.isInit = true;

      return this;
  }
}


export {Channel, ChannelState}