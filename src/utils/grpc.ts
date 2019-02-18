const { ChunkParser, ChunkType } = require("grpc-web-client/dist/ChunkParser") 
import { Root, Service, Namespace } from 'protobufjs';
import {Eth} from '../eth';
import axios from 'axios';
//@ts-ignore
import NETWORK from '../network.json';

function frameRequest(bytes:any) {
    const frame = new ArrayBuffer(bytes.byteLength + 5);
    new DataView(frame, 1, 4).setUint32(0, bytes.length, false);
    new Uint8Array(frame, 5).set(bytes);

    return new Uint8Array(frame);
}

function convertGrpcResponseChunk(response, callback) {
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

function processProtoToArray(protoObj:any): Promise<any> {
    const root = Root.fromJSON(protoObj[0]);
    const rootNSProto = _processRootNamespace(root);

    const proto = rootNSProto['nestedArray'].reduce( (accumulator, ele) => {
        const type = ele.toString().split(' ')[0];

        if(accumulator[type]) accumulator[type].push(ele);
        else accumulator[type] = [ele];
        
        return accumulator;
    } , {});

    return proto;
}

async function getServiceProto(eth:Eth, orgId: string, serviceId: string): Promise<object> {
    const netId = await eth.getNetworkId();
    const network = NETWORK[netId].protobufjs;
    const url = encodeURI(network + orgId + '/' +  serviceId);

    return (await axios.get(url)).data;
}


function _processRootNamespace(rootPb: Root) {
    const nestedNamespace = rootPb['nestedArray'].find( (element) => {
        return element.toString().includes('Namespace ');
    });

    if (!nestedNamespace) return rootPb;
    else return nestedNamespace;
}

// function parseProtoJson(proto) {
//     const root = Root.fromJSON(proto[0]);
//     return _processRootNamespace(root);
// }


export {frameRequest, getServiceProto, processProtoToArray, convertGrpcResponseChunk}