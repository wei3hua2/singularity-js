/**
 * @ignore
 */

import {SnetError} from './errors/snet-error';
import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {Tokens} from './contracts/tokens';
import {Account} from './account';
import {EthUtil} from './eth';
import { Marketplace } from './marketplace';
import { Root, NamespaceBase, Service, rpc } from 'protobufjs';
import axios from 'axios';
//@ts-ignore
import NETWORK from '../network.json';

const { ChunkParser, ChunkType } = require("grpc-web-client/dist/ChunkParser") 


abstract class Model {
    public account:Account;

    constructor(account:Account) {
        this.account = account;

        // if(!fields.id) throw new SnetError('id_not_found');
        // this.id = fields.id;
    }

    getTokens = ()=>this.account.getTokens();
    getMpe = ()=>this.account.getMpe();
    getRegistry = ()=>this.account.getRegistry();
    getEthUtil = ()=>this.account.getEthUtil();
    
}

abstract class GrpcModel extends Model {

    private rootProtoBuf:NamespaceBase;
    private protoModelArray: {[k:string]:NamespaceBase};
    protected ServiceProto: Service;

    constructor(account:Account) {
        super(account);
    }

    processProto(protoJson:Object) : void {
        this.rootProtoBuf = this.processRootNamespace(Root.fromJSON(protoJson[0]));
        this.protoModelArray = this.processProtoToArray(this.rootProtoBuf);
        this.ServiceProto = this.protoModelArray['Service'][0];

        if(!this.ServiceProto) throw new SnetError('proto_svc_not_found');
    }
    
    protected createService(url:string): rpc.Service {
        return this.ServiceProto.create(
            (method, requestObj, callback) => {
                const headers = {'content-type': 'application/grpc-web+proto', 'x-grpc-web': '1'};
                const body = this.frameRequest(requestObj);    

                axios.post(url, body, {headers:headers, responseType:'arraybuffer'})
                    .then((response) => this.convertGrpcResponseChunk(response, callback))
                    .catch((err) => callback(err, null));
                    
            }, false, false);
    }

    private processProtoToArray(root:NamespaceBase): {[k:string]:NamespaceBase} {
        const proto = root['nestedArray'].reduce( (accumulator, ele) => {
            const type = ele.toString().split(' ')[0];
    
            if(accumulator[type]) accumulator[type].push(ele);
            else accumulator[type] = [ele];
            
            return accumulator;
        } , {});
    
        return proto;
    }

    private processRootNamespace(rootPb: Root) : NamespaceBase {
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
        let error = null, chunkMessage;
        const status = response.statusText;

        if (status === 'OK') {
        const buffer = response.data;
        const chunk = new ChunkParser().parse(new Uint8Array(buffer));
        chunkMessage = chunk.find(chunk => chunk.chunkType === ChunkType.MESSAGE)

        const grpcMessage = response.headers['grpc-message'];

        if (grpcMessage != null) error = grpcMessage;
        }
        else {
        const errorStatus = status || "Connection failed";
        error = "Request failed with error ["+errorStatus+"]. Please retry in some time."
        }
    
        try
        {
            const resp = 
                chunkMessage && chunkMessage.data ? new Uint8Array(chunkMessage.data) : null;
            callback(error, resp);
        }
        catch(err) {
            console.log(err);
            callback(err);
        }
    }

}

interface Fetchable {
    _fetched: boolean;
    fetch(): Promise<boolean>;
}

export {Model, GrpcModel, Fetchable}