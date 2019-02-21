/**
 * @hidden
 */

import { EventEmitter } from 'events';
import {PromiEvent} from 'web3-core-promievent';

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
        let tx = {nonce:this.toHex(nonce), 
            from:from, to:to, 
            gas:this.toHex(gas), gasLimit: this.toHex(800000),
            gasPrice: this.toHex(this.web3.utils.toWei('10', 'gwei')),
            data: method.encodeABI()};

        return this.web3.eth.accounts.signTransaction(tx, privateKey);
    }

    getWeb3Version():string {
        return this.web3.version.api ? this.web3.version.api : this.web3.version;
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

    getNetworkId(): Promise<any> {
        return this.web3.eth.net.getId();
    }

    getBlockNumber(): Promise<number> {
        return this.web3.eth.getBlockNumber();
    }

    getAccounts(): Promise<string[]> {
        return this.web3.eth.getAccounts();
    }

    getContract(abi:any, address:string) {
        return new this.web3.eth.Contract(abi, address);
    }

    fromAscii(strVal: string): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.fromAscii(strVal);
        else
            return this.web3.fromAscii(strVal);
    }
    toUtf8(strVal: string): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.toUtf8(strVal);
        else
            return this.web3.toUtf8(strVal);
    }
    toHex(strVal: string|number): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.toHex(strVal);
        else
            return this.web3.toHex(strVal);
    }
    hexToBytes(hex:string):any[] {
        return this.web3.utils.hexToBytes(hex);
    }
    base64ToHex(base64String:string):string {
        var byteSig = Buffer.from(base64String, 'base64');
        let buff = new Buffer(byteSig);
        let hexString = "0x"+buff.toString('hex');

        return hexString;
    }

    soliditySha3(...params) {
        return this.web3.utils.soliditySha3(...params);
    }
    sign(sha3Message:string, opts:SignOptions = {}) {
        if(opts.privateKey) return this.web3.eth.accounts.sign(sha3Message, opts.privateKey);
        else throw new Error('No approach to signing');
    }

    async signMessage(message:any, privateKey:string = null) : Promise<Buffer>{
        const sha3Message: string = this.soliditySha3(...message);
        const signed = (await this.sign(sha3Message, {privateKey:privateKey})).signature;
        const stripped = signed.substring(2, signed.length);
        
        return new Buffer(Buffer.from(stripped, 'hex'));
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