/**
 * @hidden
 */

import { EventEmitter } from 'events';
import {PromiEvent} from 'web3-core-promievent';
import {Base64} from 'js-base64';

class EthUtil {
    web3: any;
    isVersion1Beyond: boolean;

    constructor(web3: any){
        this.web3 = web3;
        this.isVersion1Beyond = !(this.getWeb3Version()[0] === '0');
    }

    close(): any {
        return this.web3.currentProvider.connection.close();
    }

    call(contract, method, ...params): Promise<any> {
        return contract.methods[method](...params).call();
    }

    async transact(privateKey:string, contract, method:string, toAddress:string, txOptions:TransactOptions, ...params): Promise<any> {
        const contractMethod = contract.methods[method](...params);

        if(privateKey) {
            const signedPayload = await this.signTx(privateKey, txOptions.from, toAddress, contractMethod);
            
            return await this.web3.eth.sendSignedTransaction(signedPayload['rawTransaction']);
        } else
            return await contractMethod.send(txOptions);
        
    }

    async signTx (privateKey: string, from:string, to:string, method:any): Promise<string> {
        const nonce = await this.web3.eth.getTransactionCount(from);
        const gas = await method.estimateGas({from:from});

        let tx = {
            from:from, to:to,
            nonce:this.numberToHex(nonce),
            gas:this.numberToHex(gas),
            gasLimit: this.numberToHex(800000),
            gasPrice: this.numberToHex(this.web3.utils.toWei('10', 'gwei')),
            data: method.encodeABI()
        };

        return this.web3.eth.accounts.signTransaction(tx, privateKey);
    }

    once(contract, method, opts:EventOptions={}): Promise<any> {
        return new Promise((resolve, reject) => {
            contract.once(method,opts, (err, evt) => {
                if(err) reject(err);
                else resolve(evt);
            });
        });
    }
    event(contract, method, opts:EventOptions={}): EventEmitter {
        return contract.events[method](opts);
    }
    pastEvents(contract, method, opts:AllEventsOptions={}): Promise<any> {
        return contract.getPastEvents(method, opts);
    }
    allEvents(contract, opts:AllEventsOptions={}): Promise<any> {
        return new Promise((resolve, reject) => {
            contract.events.allEvents(opts, (err, evts) => {
                if(err) reject(err);
                else resolve(evts);
            });
        });
    }

    getWeb3Version():string {
        return this.web3.version.api ? this.web3.version.api : this.web3.version;
    }

    getContract(abi:any, address:string) {
        return new this.web3.eth.Contract(abi, address);
    }

    getNetworkId(): Promise<any> {
        return this.web3.eth.net.getId();
    }

    getBlockNumber(): Promise<number> {
        return this.web3.eth.getBlockNumber();
    }

    getAccounts(): Promise<string[]> {
        return this.web3.eth.getAccounts();
    }

    hexToAscii(strVal: string): string { return this.web3.utils.hexToAscii(strVal); }
    asciiToHex(strVal: string): any { return this.web3.utils.asciiToHex(strVal); }

    hexToUtf8(strVal: string): string { return this.web3.utils.toUtf8(strVal); }
    utf8ToHex(strVal: string): any { return this.web3.utils.fromUtf8(strVal); }

    hexToBytes(hex:string):Uint8Array { return new Uint8Array(this.web3.utils.hexToBytes(hex)); }
    bytesToHex(bytes: Uint8Array): string { return this.web3.utils.bytesToHex(bytes); }

    hexToNumber(hex:string):number { return this.web3.utils.hexToNumber(hex); }
    numberToHex(num: number): string { return this.web3.utils.numberToHex(num); }

    bytesToNumber(bytes:Uint8Array):number { return this.hexToNumber(this.bytesToHex(bytes)); }
    numberToBytes(num: number, allocSize?:number): Uint8Array { 
        const hexBytes = this.hexToBytes(this.numberToHex(num));

        if(allocSize){
            const paddings:number[] = new Array(allocSize - hexBytes.length).fill(0,0);
            const newArray = paddings.concat([...hexBytes]);
            
            return new Uint8Array(newArray);
        }
        else
            return hexBytes;
    }
    
    soliditySha3(...params) { return this.web3.utils.soliditySha3(...params); }
    
    base64ToUtf8(base64Str: string) { return Base64.decode(base64Str); }
    utf8ToBase64(strVal: string) { return Base64.encode(strVal); }

    base64ToHex(base64String:string):string {
        return this.asciiToHex(this.base64ToUtf8(base64String));
    }
    hexToBase64(hex:string):string {
        return this.utf8ToBase64(this.hexToUtf8(hex));
    }
    
    sign(sha3Message:string, opts:SignOptions = {}) {
        if(opts.privateKey) return this.web3.eth.accounts.sign(sha3Message, opts.privateKey);
        else throw new Error('No approach to signing');
    }

}

interface TransactOptions {
    from?: string;
    gasPrice?: string;
    gas?: number;
    value?: number;
}
interface SignOptions {
    privateKey?: string;
}
interface EventOptions {
    filter?: Object;
    fromBlock?: string|number;
    topics?:any[]
}
interface AllEventsOptions extends EventOptions{
    toBlock?: string|number;
}

export {EthUtil, TransactOptions, EventOptions, AllEventsOptions}