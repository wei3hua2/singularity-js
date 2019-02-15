const { ChunkParser, ChunkType } = require("grpc-web-client/dist/ChunkParser") 
class Grpc {}

function frameRequest(bytes:any) {
    const frame = new ArrayBuffer(bytes.byteLength + 5);
    new DataView(frame, 1, 4).setUint32(0, bytes.length, false);
    new Uint8Array(frame, 5).set(bytes);

    return new Uint8Array(frame);
}


export {frameRequest}