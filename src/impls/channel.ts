import { Channel, ChannelState, Account, RUN_JOB_STATE } from '../models';
import { SnetError, ERROR_CODES } from '../errors/snet-error';
import  * as pb from 'protobufjs';
import {PromiEvent} from 'web3-core-promievent';
import {SERVICE_STATE_JSON, GET_CHANNEL_STATE, FULLSERVICENAME} from '../configs/service_state_json';

class ChannelSvc extends Channel {
    constructor(account:Account, id: number, fields:any = {}) {
        super(account, id, fields);
    }

    async getChannelState(promi?: PromiEvent) : Promise<ChannelState> {
        if(!this.endpoint) throw new SnetError(ERROR_CODES.channel_endpoint_not_found, this);
        
        const cs = new ChannelStateSvc(this.account, this.endpoint, this.id);
        return await cs.init(promi);
    }

    async extendAndAddFunds(newExpiration:number, amount:number):Promise<any> {
        return await this.account.mpe.channelExtendAndAddFunds(this.id, newExpiration, amount);
    }
    async channelAddFunds(value:number):Promise<any> {
        return await this.account.mpe.channelAddFunds(this.id, value);
    }
    async channelExtend(expiration:number):Promise<any> {
        return await this.account.mpe.channelExtend(this.id, expiration);
    }

    async claimTimeout(): Promise<any> {
        return await this.account.mpe.channelClaimTimeout(this.id);
    }

}

class ChannelStateSvc extends ChannelState {
    constructor(account:Account, endpoint:string, channelId:number) {
        super(account, endpoint, channelId);
    }

    async init(promi?: PromiEvent): Promise<ChannelState> {
        if(this.isInit) return this;
  
        this.initGrpc(SERVICE_STATE_JSON);
  
        const byteschannelID = this.account.eth.numberToBytes(this.channelId, 4);
        const byteSig:Uint8Array = await this.signChannelId();
        const request = {"channelId":byteschannelID, "signature":byteSig};
  
        if(promi) promi.emit(RUN_JOB_STATE.request_channel_state, request);
        
        let channelResponse;
        try{
          channelResponse = await this.createService()['getChannelState'](request);
        }catch(err) {
          throw new SnetError(ERROR_CODES.channelstate_svc_call_error, err.message);
        }
  
        this.data = {
            currentNonce: this.account.eth.bytesToNumber(channelResponse.currentNonce), 
            currentSignedAmount: parseInt(this.account.eth.bytesToHex(channelResponse.currentSignedAmount))
        };
  
        this.isInit = true;
  
        return this;
      }

    set data (data: Object) {
        this.endpoint = data['endpoint'] || this.endpoint;
        this.channelId = data['channelId'] || this.channelId;
        this.currentSignature = data['currentSignature'] || this.currentSignature;
        this.currentNonce = data['currentNonce'] || this.currentNonce;
        this.currentSignedAmount = data['currentSignedAmount'] || this.currentSignedAmount;
    }

    get data () {
        return {
            channelId: this.channelId, endpoint: this.endpoint, 
            currentSignature: this.currentSignature, currentNonce: this.currentNonce,
            currentSignedAmount: this.currentSignedAmount
        };
    }

    async signChannelId(): Promise<Uint8Array> {
        const sha3Message: string = this.account.eth.soliditySha3({t: 'uint256', v: this.channelId});
        const privateKey: string = this.account.privateKey;
        const opts = {privateKey: privateKey,address: this.account.address};      
  
        const signedPayload = await this.account.eth.sign(sha3Message, opts);
  
        const signed = signedPayload.signature ? signedPayload.signature : signedPayload;
        const stripped = signed.substring(2, signed.length);
  
        return new Uint8Array(stripped.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
    }

    public serviceUrl(method: pb.Method): string {
        return `${this.endpoint}/${FULLSERVICENAME}/${GET_CHANNEL_STATE}`;
    }
}

export {ChannelSvc, ChannelStateSvc}