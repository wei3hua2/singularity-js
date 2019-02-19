/**
 * @module channel
 */

import {rpc} from 'protobufjs';
import {Channel} from './channel';
import { GrpcModel } from './model';

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

    constructor(web3:any, endpoint:string, channel:Channel){
        super(web3);
        this.endpoint = endpoint;
        this.channel = channel;

        const url = `${this.endpoint}/${this.FULLSERVICENAME}/${this.GET_CHANNEL_STATE}`;
        this.channelStateService = this.createService(url);
    }

    async getState(opts:ChannelStateOpts = {}) : Promise<ChannelStateResponse> {
        const byteschannelID = this.channel.getByteChannelId();
        const byteSig = await this.channel.signChannelId(opts.privateKey);
        const request = {"channelId":byteschannelID, "signature":byteSig};

        const channelResponse = await this.channelStateService['getChannelState'](request);

        const curNonce = parseInt('0x' + 
            Buffer.from(channelResponse.currentNonce).toString('hex',0,channelResponse.currentNonce.length));
        const curSignedAmt = parseInt('0x' + 
            Buffer.from(channelResponse.currentSignedAmount).toString('hex',0,channelResponse.currentSignedAmount.length));

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
  currentSignature: Buffer;
  currentNonce: number; 
  currentSignedAmount: number;
}

export {ChannelState, ChannelStateResponse, ChannelStateOpts}