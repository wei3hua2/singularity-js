import * as pb from 'protobufjs';
import {Account} from '../models/account';
import {ServiceInfo, ServiceFieldInfo} from '../models/service';
import axios from 'axios';
import {Buffer} from 'buffer';

//@ts-ignore
import {NETWORK} from '../configs/network';

import {Grpc} from '../models/grpc';
import { SnetError, ERROR_CODES } from '../errors';

abstract class SvcGrpc extends Grpc {
    organizationId: string;
    id: string;
    endpoint: string;
    isProtoInit: boolean;
    price: number;
    
    account: Account;

    abstract initMetadata(): Promise<any>;

    public async initProtoBuf(): Promise<any> {
        if(this.isProtoInit) return this;

        await this.initMetadata();
        
        const proto = await this.getServiceProto(this.organizationId, this.id);
        this.initGrpc(proto);
        
        this.isProtoInit = true;

        return this;
    }

    public defaultRequest(method: string): Object {
        if(!this.isProtoInit) throw new SnetError(ERROR_CODES.svc_protobuf_not_init);
        
        const list = this.protoDataTypes;
        const type = list[this.ServiceProto.methods[method].requestType];

        return type.toObject(type.fromObject({}), {defaults:true});
    }
    public info(): ServiceInfo{
        if(!this.isProtoInit) throw new SnetError(ERROR_CODES.svc_protobuf_not_init);
        
        const methods = this.ServiceProto.methods;
        const types = this.protoDataTypes;
        
        //@ts-ignore
        const m = Object.entries(methods).reduce((accum, entry)=> {
            const methodName = entry[0], method = entry[1];
            accum[methodName] = {
                request: {
                    name: method.requestType,
                    fields: this.parseTypeFields(types, method.requestType, false)
                },
                response: {
                    name: method.responseType,
                    fields: this.parseTypeFields(types, method.responseType, false)
                }
            };
            return accum;
        },{});

        return {
            name: this.ServiceProto.name,
            methods: m
        };
    }

    serviceUrl(method: pb.Method): string {
        const serviceName = this.ServiceProto.parent.name ? 
            this.ServiceProto.parent.name+'.'+this.ServiceProto.name : this.ServiceProto.name;
        
        return `${this.endpoint}/${serviceName}/${method.name}`;
    }

    parseTypeFields (typeList:any, typeName:string, pbField:boolean): ServiceFieldInfo {
        //@ts-ignore
        return Object.entries(typeList[typeName].fields).reduce((accum, entry:any) => {
            const name = entry[0], type = entry[1].type;
            let val = entry[1].defaultValue;
            
            if(val === null || val === undefined) {
                if(type === 'bytes' || type === 'string') val = '';
                else val = 0;
            }

            accum[name] = pbField ? 
                entry[1] : {
                    type: type, required: entry[1].required, 
                    optional: entry[1].optional, value: val};
            return accum;
        }, {});
    }

    async getServiceProto(organizationId: string, serviceId: string): Promise<object> {
        const netId = await this.account.eth.getNetworkId();
        const network = NETWORK[netId].protobufjs;
        const url = encodeURI(network + organizationId + '/' +  serviceId);
    
        const result = (await axios.get(url)).data;

        return result;
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

        return {
            'snet-payment-type': 'escrow', 
            'snet-payment-channel-id': header.channelId, 'snet-payment-channel-nonce': header.nonce,
            'snet-payment-channel-amount': header.price_in_cogs, 'snet-payment-channel-signature-bin': signed
        };
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

    //super methods
    public initGrpc(protoJson:Object) {return super.initGrpc(protoJson);}
    public createService(additionalHeaders:any={}): pb.rpc.Service {return super.createService(additionalHeaders);}
    public getTypes(protoArray): {[type:string]:pb.Type} {return super.getTypes(protoArray);}
    public convertProtoToArray(root:pb.NamespaceBase): {[k:string]:pb.NamespaceBase[]}  {return super.convertProtoToArray(root);}
    public getRootNamespace(protoJson: Object) : pb.NamespaceBase {return super.getRootNamespace(protoJson);}
    public frameRequest(bytes:any) {return super.frameRequest(bytes);}
    public convertGrpcResponseChunk(response, callback) {return super.convertGrpcResponseChunk(response, callback);}
}

export {SvcGrpc}