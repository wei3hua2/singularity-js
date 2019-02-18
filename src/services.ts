import {Eth} from './eth';
import {Mpe} from './contracts/mpe';
import {Registry} from './contracts/registry';
import axios from 'axios';
import {Ipfs} from './ipfs';
import { Root, Service, Namespace } from 'protobufjs';
import {frameRequest} from './utils/grpc';

import { ChunkParser, ChunkType } from "grpc-web-client/dist/ChunkParser";

//@ts-ignore
import MarketplaceNetwork from './network.json';



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



class Services {
    eth: Eth;
    mpe: Mpe;
    registry: Registry;
    protoRoot:Root;

    constructor(eth:Eth, mpe:Mpe, registry:Registry){
        this.eth = eth;
        this.mpe = mpe;
        this.registry = registry;
    }
    
    async createService (orgId:string , serviceId:string, channel:Channel, endpoint:string,
        curSignedAmt:number, opts:CreateSvcOptions = {}): Promise<any> {
        const proto = await this.getProto(orgId, serviceId);
        const Svc = proto['Service'][0];
        
        const host:string = endpoint;

        const service = await this.registry.getServiceRegistrationById(orgId,serviceId);
        const svcMetadata = await Ipfs.cat(service.metadataURI.replace('ipfs://',''));
        const price_in_cogs = svcMetadata.pricing.price_in_cogs + curSignedAmt;

        const signed = await this.signChallengeMessage(channel, price_in_cogs, opts.privateKey);
        const requestHeaders = await this.parseAgentRequestHeader(signed, channel, price_in_cogs);

        return Svc.create(
            (method, requestObject, callback) => {
                const fullmethod = method.toString().split(' ')[1].trim().substring(1);
                const serviceName = fullmethod.split('.')[0] + '.' + fullmethod.split('.')[1];
                const methodName = fullmethod.split('.')[2];
                
                const headers = Object.assign({}, 
                    {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'},
                    requestHeaders);

                const url = `${host}/${serviceName}/${methodName}`;
                const body = frameRequest(requestObject);

                axios.post(url, body, {headers:headers,responseType:'arraybuffer'})
                    .then((response) => {
                        this.processGrpcResponse(response, callback);
                    }).catch((err) => {
                        console.log(err.message);
                        callback(err, null);
                    });

            }, false ,false);
    }

    async signChallengeMessage(channel:Channel, priceInCogs:number, 
        privateKey:string = null): Promise<string> {
        const contractAddress = await this.mpe.getNetworkAddress();
    
        const sha3Message: string = this.eth.soliditySha3(
          {t: 'address', v: contractAddress}, {t: 'uint256', v: channel.channelId},
          {t: 'uint256', v: channel.nonce}, {t: 'uint256', v: priceInCogs}
        );
    
        return (await this.eth.sign(sha3Message, {privateKey:privateKey})).signature;
      }
    
    parseAgentRequestHeader(signed, channel:Channel, priceInCogs:number) {
        const stripped = signed.substring(2, signed.length);
        const byteSig = global.Buffer.from(stripped, 'hex');
        const buff = new global.Buffer(byteSig);
        const base64data = buff.toString('base64');
    
        return {
          'snet-payment-type': 'escrow',
          'snet-payment-channel-id': channel.channelId,
          'snet-payment-channel-nonce': channel.nonce,
          'snet-payment-channel-amount': priceInCogs,
          'snet-payment-channel-signature-bin': base64data
        };
    }

    async getProto(orgId: string, serviceId: string): Promise<any> {
        const rootNSProto = await this.getRootNamespaceProto(orgId, serviceId);

        const proto = rootNSProto['nestedArray'].reduce( (accumulator, ele) => {
            const type = ele.toString().split(' ')[0];

            if(accumulator[type]) accumulator[type].push(ele);
            else accumulator[type] = [ele];
            
            return accumulator;
        } , {});

        return proto;
    }

    private async getRootNamespaceProto(orgId:string, serviceId:string): Promise<any> {
        const protoObj = await this.getServiceProtoFile(orgId, serviceId);
        const root = Root.fromJSON(protoObj[0]);

        return this.processRootNamespace(root);
    }

    async getServiceProtoFile(orgId: string, serviceId: string): Promise<object> {
        const url = encodeURI(await this.getServiceProtoUrl() + orgId + '/' +  serviceId);

        return (await axios.get(url)).data;
    }

    private async getServiceProtoUrl (): Promise<string>{
        const netId = await this.eth.getNetworkId();
        const network = MarketplaceNetwork[netId];

        return network.protobufjs;
    }

    private processRootNamespace(rootPb: Root) {
        const nestedNamespace = rootPb['nestedArray'].find( (element) => {
            return element.toString().includes('Namespace ');
        });
    
        if (!nestedNamespace) return rootPb;
        else return nestedNamespace;
    }


    async signChannelId(channelId:number, privateKey:string) {
        const sha3Message: string = this.eth.soliditySha3({t: 'uint256', v: channelId});
        const signed = (await this.eth.sign(sha3Message, {privateKey:privateKey})).signature;

        const stripped = signed.substring(2, signed.length);
        const byteSig = new Buffer(Buffer.from(stripped, 'hex'));
        
        const byteschannelID = Buffer.alloc(4);
        byteschannelID.writeUInt32BE(channelId, 0);

        return {"channelId":byteschannelID, "signature":byteSig};
    }

    async createChannelStateService(endpoint:string) {
        const packageName = 'escrow', 
            serviceName = 'PaymentChannelStateService', methodName = 'GetChannelState', 
            fullServiceName = packageName + '.' + serviceName;

        const Svc = Root.fromJSON(SERVICE_STATE_JSON).lookup(serviceName);
            
        // @ts-ignore
        const serviceObject = Svc.create(
            (method, requestObject, callback) => {
                const headers = {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'};

                const url = `${endpoint}/${fullServiceName}/${methodName}`;
                const body = frameRequest(requestObject);

                axios.post(url, body, {headers:headers, responseType:'arraybuffer'})
                    .then((response) => {
                        this.processGrpcResponse(response, callback);
                    }).catch((err) => {
                        console.log(err.message);
                        callback(err, null);
                    });
                }, false, false);

        return serviceObject;
    }

    private processGrpcResponse(response, callback) {
        let error = null, chunk, chunkMessage;
        const status = response.statusText;

        if (status === 'OK') {
          const buffer = response.data;
          chunk = new ChunkParser().parse(new Uint8Array(buffer));
          chunkMessage = chunk.find(chunk => chunk.chunkType === ChunkType.MESSAGE)

          const grpcMessage = response.headers['Grpc-Message'];
          if (grpcMessage != null && chunk == null) error = grpcMessage;
          
        }
        else {
          let errorStatus = "Connection failed"
          errorStatus = response.statusText;
          error = "Request failed with error ["+errorStatus+"]. Please retry in some time."
        }
      
        try
        {
            const resp = chunkMessage && chunkMessage.data ? new Uint8Array(chunkMessage.data) : null;

            callback(error, resp);
        }
        catch(err) {
            console.log(err);
            callback(err);
        }
      }
}

interface Channel {
    channelId: number;
    balance_in_cogs: string;
    pending: string;
    nonce: number;
    expiration: number;
    signer: string;
}

interface CreateSvcOptions {
    privateKey?:string;
}

export {Services, Channel}