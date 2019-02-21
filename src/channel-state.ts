/**
 * @module channel
 */

import {Channel} from './channel';
import {rpc} from 'protobufjs';
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

        const url = `${this.endpoint}/${this.FULLSERVICENAME}/${this.GET_CHANNEL_STATE}`;
        this.channelStateService = this.createService(url);
    }

    async getState(opts:ChannelStateOpts = {}) : Promise<ChannelStateResponse> {
        const byteschannelID = this.channel.getByteChannelId();
        const byteSig:Uint8Array = await this.channel.signChannelId(opts.privateKey);
        const request = {"channelId":byteschannelID, "signature":byteSig};

        const channelResponse = await this.channelStateService['getChannelState'](request);

        const curNonce = parseInt(this._eth.bytesToHex(channelResponse.currentNonce));
        const curSignedAmt = parseInt(this._eth.bytesToHex(channelResponse.currentSignedAmount));

        return {
          currentSignature: channelResponse.currentSignature, 
          currentNonce: curNonce, 
          currentSignedAmount: curSignedAmt
        };
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