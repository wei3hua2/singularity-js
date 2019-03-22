/**
 * @ignore
 */

import {SnetError} from '../errors/snet-error';
import { Root, NamespaceBase, Service, rpc, Type, Method } from 'protobufjs';
import axios from 'axios';

import { ChunkParser, ChunkType } from "grpc-web-client/dist/ChunkParser";


abstract class Grpc {
    public ServiceProto: Service;
    public protoDataTypes: {[type:string]:Type};

    public initGrpc(protoJson:Object) {
        const rootProtoBuf = this.getRootNamespace(protoJson);
        const protoModelArray = this.convertProtoToArray(rootProtoBuf);

        this.ServiceProto = <Service>protoModelArray['Service'][0];
        this.protoDataTypes = this.getTypes(protoModelArray);
        
        if(!this.ServiceProto) throw new SnetError('proto_svc_not_found');

        return this.ServiceProto;
    }

    public abstract serviceUrl(method: Method): string;
    
    public createService(additionalHeaders:any={}): rpc.Service {
        
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

    public getTypes(protoArray): {[type:string]:Type} {
        return protoArray['Type'].reduce( (result, t) => {
            result[t['name']] = t;
            return result;
        },{});
    }

    public convertProtoToArray(root:NamespaceBase): {[k:string]:NamespaceBase[]} {
        const proto = root['nestedArray'].reduce( (accumulator, ele) => {
            const type = ele.toString().split(' ')[0];
    
            if(accumulator[type]) accumulator[type].push(ele);
            else accumulator[type] = [ele];
            
            return accumulator;
        } , {});
    
        return proto;
    }

    public getRootNamespace(protoJson: Object) : NamespaceBase {
        const rootPb = Array.isArray(protoJson) ? Root.fromJSON(protoJson[0]) : Root.fromJSON(protoJson);

        const nestedNamespace = rootPb['nestedArray'].find( (element) => {
            return element.toString().includes('Namespace ');
        });
    
        if (!nestedNamespace) return rootPb;
        else return <NamespaceBase>nestedNamespace;
    }

    public frameRequest(bytes:any) {
        const frame = new ArrayBuffer(bytes.byteLength + 5);
        new DataView(frame, 1, 4).setUint32(0, bytes.length, false);
        new Uint8Array(frame, 5).set(bytes);

        return new Uint8Array(frame);
    }

    public convertGrpcResponseChunk(response, callback) {
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