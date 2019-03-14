/**
 * @hidden
 */

import { EventEmitter } from 'events';
import {PromiEvent} from 'web3-core-promievent';
import {Base64} from 'js-base64';


import {CONFIG} from '../configs/config';
import {NETWORK} from '../configs/network';

class EthUtil {
    web3: any;
    ethereum: any;
    isVersion1Beyond: boolean;

    constructor(web3: any, ethereum: any = null){
        this.web3 = web3;
        this.ethereum = ethereum;
        this.isVersion1Beyond = !(this.getWeb3Version()[0] === '0');
    }

    async init() {
        let init = true;
        if(this.ethereum) init = await this.ethereum.enable();
        
        return init;
    }

    close(): any {
        return this.web3.currentProvider.connection.close();
    }

    call(contract, method, ...params): Promise<any> {
        return contract.methods[method](...params).call();
    }

    transact(privateKey:string, contract, method:string, toAddress:string, 
                   txOptions:TransactOptions, ...params): PromiEvent {
        
        const contractMethod = contract.methods[method](...params);

        if(privateKey) {
            const promi = new PromiEvent();

            this.signTx(privateKey, txOptions.from, toAddress, contractMethod).then((signedPayload) => {
                promi.emit('signed', signedPayload);
                this.web3.eth.sendSignedTransaction(signedPayload['rawTransaction'])
                    .on('receipt', (receipt)=>promi.emit('receipt', receipt))
                    .on('transactionHash', (receipt)=>promi.emit('transactionHash', receipt))
                    .on('confirmation', (receipt)=>promi.emit('confirmation', receipt))
                    .catch((error)=> promi.reject(error))
                    .then((receipt)=>promi.resolve(receipt));
            }).catch(error => promi.reject(error));

            return promi;
        } else
            return contractMethod.send(txOptions);
    }

    async signTx (privateKey: string, from:string, to:string, method:any): Promise<string> {
        const nonce = await this.web3.eth.getTransactionCount(from);
        const gas = await method.estimateGas({from:from});
        const gas_price = parseInt(await this.web3.eth.getGasPrice());
        

        let tx = {
            from:from, to:to,
            nonce:this.numberToHex(nonce),
            gas:this.numberToHex(gas),
            gasLimit: this.numberToHex(CONFIG['GAS_LIMIT']),
            gasPrice: this.numberToHex(gas_price),
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
        return contract.events[method](opts, (error, event) => {});
    }
    pastEvents(contract, method, opts:EventOptions={}): Promise<any> {
        return contract.getPastEvents(method, opts);
    }
    allEvents(contract, opts:EventOptions={}): Promise<any> {
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

    _netId: number;
    async getNetworkId(): Promise<number> {
        if(!this._netId) this._netId = await this.web3.eth.net.getId();

        return this._netId;
    }
    getNetwork(): Promise<string> {
        return this.web3.eth.net.getId().then((id) => NETWORK[id].name);
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

    asciiToBytes(ascii:string) { return this.web3.utils.fromAscii(ascii); }
    bytesToAscii(ascii:string) { return this.web3.utils.toAscii(ascii); }

    hexToBytes(hex:string):Uint8Array { return this.web3.utils.hexToBytes(hex); }
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
    
    atob(base64Str: string) { return Base64.atob(base64Str); }
    base64ToUtf8(base64Str: string) { return Base64.decode(base64Str); }
    utf8ToBase64(strVal: string) { return Base64.encode(strVal); }
    encodeBase64(val: any) { return Base64.encode(val); }

    base64ToHex(base64String:string):string {
        return this.asciiToHex(this.base64ToUtf8(base64String));
    }
    hexToBase64(hex:string):string {
        return this.utf8ToBase64(this.hexToUtf8(hex));
    }
    
    sign(sha3Message:string, opts:SignOptions = {}) {
        if(opts.privateKey) return this.web3.eth.accounts.sign(sha3Message, opts.privateKey);
        else if(opts.address){
            return this.web3.eth.personal.sign(sha3Message, opts.address, '');
        }
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
    address?: string;
}
interface EventOptions {
    filter?: Object;
    fromBlock?: string|number;
    toBlock?: string|number;
    topics?:any[]
}

export {EthUtil, TransactOptions, EventOptions}