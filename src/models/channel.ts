import {Data} from './index';
import {Grpc} from './grpc';
import {rpc, Method} from 'protobufjs';
import {Account} from './account';
import {PromiEvent} from 'web3-core-promievent';

const SERVICE_STATE_JSON = {
    "nested": {
      "escrow": {
        "nested": {
          "PaymentChannelStateService": {
            "methods": {
              "GetChannelState": {
                "requestType": "ChannelStateRequest",
                "responseType": "ChannelStateReply"
              }
            }
          },
          "ChannelStateRequest": {
            "fields": {
              "channelId": {
                "type": "bytes",
                "id": 1
              },
              "signature": {
                "type": "bytes",
                "id": 2
              }
            }
          },
          "ChannelStateReply": {
            "fields": {
              "currentNonce": {
                "type": "bytes",
                "id": 1
              },
              "currentSignedAmount": {
                "type": "bytes",
                "id": 2
              },
              "currentSignature": {
                "type": "bytes",
                "id": 3
              }
            }
          }
        }
      }
    }
  }

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
        return {
            id: this.id, nonce: this.nonce, sender: this.sender, signer: this.signer,
            recipient: this.recipient, groupId: this.groupId, value: this.value, expiration: this.expiration,
            balance_in_cogs: this.balance_in_cogs, pending: this.pending, endpoint: this.endpoint
        };
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
    PACKAGENAME = 'escrow';
    SERVICENAME = 'PaymentChannelStateService';
    GET_CHANNEL_STATE = 'GetChannelState';
    FULLSERVICENAME = this.PACKAGENAME + '.' + this.SERVICENAME;

    endpoint:string;
    channelId: string;
    url: string;
    currentSignature: string;
    currentNonce: string;
    currentSignedAmount: number;

    isInit: boolean = false;
    channel:Channel;

    constructor(web3:any, endpoint:string, channel:Channel) {
        super(web3);
        this.channel = channel;
        this.data = {channelId: channel.id, endpoint: endpoint};
        
        this.processProto(SERVICE_STATE_JSON);
    }

    set data (data: Object) {
        this.endpoint = data['endpoint'] || this.endpoint;
        this.url = data['url'] || this.url;
        this.channelId = data['channelId'] || this.channelId;
        this.currentSignature = data['currentSignature'] || this.currentSignature;
        this.currentNonce = data['currentNonce'] || this.currentNonce;
        this.currentSignedAmount = data['currentSignedAmount'] || this.currentSignedAmount;
    }

    get data () {
        return {
            channelId: this.channelId, endpoint: this.endpoint, url: this.url,
            currentSignature: this.currentSignature, currentNonce: this.currentNonce,
            currentSignedAmount: this.currentSignedAmount
        };
    }

    async init(promi?: PromiEvent): Promise<ChannelState> {
        if(this.isInit) return this;

        const byteschannelID = this.account.eth.numberToBytes(this.channel.id, 4);
        const byteSig:Uint8Array = await this.signChannelId(promi);
        const request = {"channelId":byteschannelID, "signature":byteSig};

        const channelResponse = await this.createService()['getChannelState'](request);

        this.data = {
            currentNonce: this.account.eth.bytesToNumber(channelResponse.currentNonce), 
            currentSignedAmount: parseInt(this.account.eth.bytesToHex(channelResponse.currentSignedAmount))
        };

        this.isInit = true;

        return this;
    }

    async signChannelId(promi?: PromiEvent): Promise<Uint8Array> {
        const sha3Message: string = this.account.eth.soliditySha3({t: 'uint256', v: this.channel.id});
        const privateKey: string = this.account.privateKey;
        const opts = {privateKey: privateKey,address: this.account.address};
        
        if(promi) promi.emit('sign_channel_opts', opts);
  
        const signedPayload = await this.account.eth.sign(sha3Message, opts);
  
        if(promi) promi.emit('signed_channel', signedPayload);
  
        const signed = signedPayload.signature ? signedPayload.signature : signedPayload;
        const stripped = signed.substring(2, signed.length);
  
        return new Uint8Array(stripped.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    }

    protected serviceUrl(method: Method): string {
        return `${this.endpoint}/${this.FULLSERVICENAME}/${this.GET_CHANNEL_STATE}`;
    }
}


export {Channel, ChannelState}