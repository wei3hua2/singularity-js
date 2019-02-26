/**
 * @module channel
 */

import {Channel} from './channel';
import {rpc, Method} from 'protobufjs';
import { GrpcModel } from './model';
import { EthUtil } from './eth';

/**
 * @ignore
 */
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

class ChannelState extends GrpcModel{
    PACKAGENAME = 'escrow';
    SERVICENAME = 'PaymentChannelStateService';
    GET_CHANNEL_STATE = 'GetChannelState';
    FULLSERVICENAME = this.PACKAGENAME + '.' + this.SERVICENAME;

    endpoint:string;
    channelStateService:rpc.Service;
    channel:Channel;
    url: string;

    _eth: EthUtil;

    constructor(web3:any, endpoint:string, channel:Channel){
        super(web3);
        this.endpoint = endpoint;
        this.channel = channel;
        this._eth = this.channel._eth;

        this.processProto(SERVICE_STATE_JSON);
        
        this.channelStateService = this.createService();
    }

    protected serviceUrl(method: Method): string {
      return `${this.endpoint}/${this.FULLSERVICENAME}/${this.GET_CHANNEL_STATE}`;
    }

    async getState() : Promise<ChannelStateResponse> {
        const byteschannelID = this.getByteChannelId();
        const byteSig:Uint8Array = await this.signChannelId();
        const request = {"channelId":byteschannelID, "signature":byteSig};

        const channelResponse = await this.channelStateService['getChannelState'](request);

        const curNonce = this._eth.bytesToNumber(channelResponse.currentNonce);
        const curSignedAmt = parseInt(this._eth.bytesToHex(channelResponse.currentSignedAmount));

        return {
          currentSignature: channelResponse.currentSignature, 
          currentNonce: curNonce, 
          currentSignedAmount: curSignedAmt
        };
    }

  async signChannelId(): Promise<Uint8Array> {
      const sha3Message: string = this._eth.soliditySha3({t: 'uint256', v: this.channel.id});
      const privateKey: string = this.account.getPrivateKey();
      const signedPayload = await this._eth.sign(sha3Message, {privateKey:privateKey});

      const signed = signedPayload.signature;
      const stripped = signed.substring(2, signed.length);

      return new Uint8Array(stripped.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)));
  }

  getByteChannelId(): Uint8Array {
      const channelBytes = this._eth.numberToBytes(this.channel.id, 4);
      
      return channelBytes;
  }
}

interface ChannelStateOpts {
  privateKey?: string;
}

interface ChannelStateResponse {
  currentSignature: Uint8Array;
  currentNonce: number; 
  currentSignedAmount: number;
}

export {ChannelState, ChannelStateResponse, ChannelStateOpts}