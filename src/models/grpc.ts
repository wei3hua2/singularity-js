/**
 * @ignore
 */

import {SnetError} from '../errors/snet-error';
import {Account} from './account';
import { Root, NamespaceBase, Service, rpc, Type, Method } from 'protobufjs';
import axios from 'axios';

// const { ChunkParser, ChunkType } = require("grpc-web-client/dist/ChunkParser") 
import { ChunkParser, ChunkType } from "grpc-web-client/dist/ChunkParser";


abstract class Grpc {
    public rootProtoBuf:NamespaceBase;
    public protoModelArray: {[k:string]:NamespaceBase[]};
    public ServiceProto: Service;
    public dataTypesProto: {[type:string]:Type};
    public rawJsonProto: Object;

    public account: Account;

    constructor(account:Account) {
        this.account = account;
    }

    processProto(protoJson:Object) : void {
        this.rawJsonProto = protoJson;
        this.rootProtoBuf = this.getRootNamespace(protoJson);
        this.protoModelArray = this.convertProtoToArray(this.rootProtoBuf);

        this.ServiceProto = <Service>this.protoModelArray['Service'][0];
        this.dataTypesProto = this.getTypes(this.protoModelArray);
        
        if(!this.ServiceProto) throw new SnetError('proto_svc_not_found');
    }

    protected abstract serviceUrl(method: Method): string;
    
    protected createService(additionalHeaders:any={}): rpc.Service {
        
        return this.ServiceProto.create(
            (method:Method, requestObj, callback) => {
                const fullurl = this.serviceUrl(method);

                const headers = Object.assign(
                    {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'},
                    additionalHeaders);
                const body = this.frameRequest(requestObj);

                axios.post(fullurl, body, {headers:headers, responseType:'arraybuffer'})
                    .then((response) => this.convertGrpcResponseChunk(response, callback))
                    .catch((err) => callback(err, null));
                    
            }, false, false);
    }

    private getTypes(protoArray): {[type:string]:Type} {
        return protoArray['Type'].reduce( (result, t) => {
            result[t['name']] = t;
            return result;
        },{});
    }

    private convertProtoToArray(root:NamespaceBase): {[k:string]:NamespaceBase[]} {
        const proto = root['nestedArray'].reduce( (accumulator, ele) => {
            const type = ele.toString().split(' ')[0];
    
            if(accumulator[type]) accumulator[type].push(ele);
            else accumulator[type] = [ele];
            
            return accumulator;
        } , {});
    
        return proto;
    }

    private getRootNamespace(protoJson: Object) : NamespaceBase {
        const rootPb = Array.isArray(protoJson) ? Root.fromJSON(protoJson[0]) : Root.fromJSON(protoJson);

        const nestedNamespace = rootPb['nestedArray'].find( (element) => {
            return element.toString().includes('Namespace ');
        });
    
        if (!nestedNamespace) return rootPb;
        else return <NamespaceBase>nestedNamespace;
    }

    protected frameRequest(bytes:any) {
        const frame = new ArrayBuffer(bytes.byteLength + 5);
        new DataView(frame, 1, 4).setUint32(0, bytes.length, false);
        new Uint8Array(frame, 5).set(bytes);

        return new Uint8Array(frame);
    }

    protected convertGrpcResponseChunk(response, callback) {
        let errorMsg = null, chunkMessage;
        const status = response.statusText;

        if (status === 'OK') {
            const buffer = response.data;
            const chunk = new ChunkParser().parse(new Uint8Array(buffer));
            chunkMessage = chunk.find(chunk => chunk.chunkType === ChunkType.MESSAGE)

            const grpcMessage = response.headers['grpc-message'];

            if (grpcMessage != null) errorMsg = grpcMessage;
        }
        else {
            const errorStatus = status || "Connection failed";
            errorMsg = "Request failed with error ["+errorStatus+"]. Please retry in some time.";
        }
    
        try{
            const resp = chunkMessage && chunkMessage.data ? new Uint8Array(chunkMessage.data) : null;
            
            if(errorMsg) callback(new Error(errorMsg), resp);
            else callback(null, resp);
        }
        catch(err) {
            callback(err);
        }
    }

}

export {Grpc}