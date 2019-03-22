import * as pb from 'protobufjs';
import {Account} from '../models/account';
import {ServiceInfo, ServiceFieldInfo} from '../models/service';
import axios from 'axios';

//@ts-ignore
import {NETWORK} from '../configs/network';

import {Grpc} from '../models/grpc';
import { SnetError, ERROR_CODES } from '../errors';

class SvcGrpc extends Grpc {
    endpoint: string;
    isProtoInit: boolean;
    
    account: Account;
    public serviceUrl(method: pb.Method): string {
        const serviceName = this.ServiceProto.parent.name ? 
            this.ServiceProto.parent.name+'.'+this.ServiceProto.name : this.ServiceProto.name;
        
        return `${this.endpoint}/${serviceName}/${method.name}`;
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