import {Root, Service} from 'protobufjs';
import {frameRequest, convertGrpcResponseChunk} from './utils/grpc';
import axios from 'axios';
import {Channel} from './channel';

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

class ChannelState {
    PACKAGENAME = 'escrow';
    SERVICENAME = 'PaymentChannelStateService';
    GET_CHANNEL_STATE = 'GetChannelState';
    FULLSERVICENAME = this.PACKAGENAME + '.' + this.SERVICENAME;

    endpoint:string;
    channelStateService:Service;
    channel:Channel;

    constructor(endpoint:string, channel:Channel){
        this.endpoint = endpoint;
        this.channel = channel;
        this.channelStateService = this.create(endpoint);
    }

    private create(endpoint:string) {
        const Svc = Root.fromJSON(SERVICE_STATE_JSON).lookup(this.SERVICENAME);
        const url = `${this.endpoint}/${this.FULLSERVICENAME}/${this.GET_CHANNEL_STATE}`;

        // @ts-ignore
        return Svc.create(
            (method, requestObj, callback) => {
                const headers = {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'};
                const body = frameRequest(requestObj);    

                axios.post(url, body, {headers:headers, responseType:'arraybuffer'})
                    .then((response) => convertGrpcResponseChunk(response, callback))
                    .catch((err) => callback(err, null));
                    
            }, false, false);
    }

    async getChannelState(opts:ChannelStateOpts = {}) {
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

export {ChannelState}