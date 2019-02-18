/**
 * @hidden
 */

import * as bb from 'bluebird';
import {ContractTxOptions} from './contracts/contract';

class Eth {
    web3: any;
    isVersion1Beyond: boolean;
    constructor(web3: any){
        this.web3 = web3;
        this.isVersion1Beyond = !(this.getWeb3Version()[0] === '0');
    }

    close(): any {
        return this.web3.currentProvider.connection.close();
    }

    getWeb3Version():string {
        return this.web3.version.api ? this.web3.version.api : this.web3.version;
    }

    getNetworkId(): Promise<any> {
        if(this.isVersion1Beyond)
            return this.web3.eth.net.getId();
        else
            return new bb.Promise((resolve, reject) => {
                this.web3.version.getNetwork((err, netId) => {
                    if(err) reject(err);
                    else resolve(netId);
                });
            });
    }

    getBlockNumber(): Promise<number> {
        return new bb.Promise( (resolve, reject) => {
            this.web3.eth.getBlockNumber((error, result) => {
                if(error) reject(error);
                else resolve(result);
            });
        });
    }

    getAccounts(): Promise<string[]> {
        return this.web3.eth.getAccounts();
    }

    initContract(abi, address) : any {
            return this.isVersion1Beyond ? 
                new this.web3.eth.Contract(abi, address) :
                this.web3.eth.contract(abi).at(address);
    }

    call(contract, method, ...params): Promise<any> {
        return new bb.Promise((resolve, reject) => {
            const cb = (err, result) => { 
                if(err) reject(err);
                else resolve(result);
            };

            if(this.isVersion1Beyond) {
                contract.methods[method](...params).call(cb);
            }
            else {
                contract[method].call(...params, cb);
            }
        });
    }

    async transact(contract, method, txOptions:ContractTxOptions, ...params): Promise<any> {
            
            if(this.isVersion1Beyond) {
                
                const contractMethod = contract.methods[method](...params);

                if(txOptions.signTx) {
                    const signedPayload = await this.signTx(
                        txOptions.privateKey, txOptions.from, txOptions.contractAddress, contractMethod);

                    return await this.web3.eth.sendSignedTransaction(signedPayload['rawTransaction']);
                    
                } else
                    return await contractMethod.send(txOptions);
            }
            else {
                throw Error('version 1 below not implemented yet');
                //ERROR
                // return new bb.Promise((resolve, reject) => {
                //     const cb = (err, result) => { 
                //         if(err) reject(err);
                //         else resolve(result);
                //     };
                //     contract[method].sendTransaction(...params, txOptions, cb);
                // });
            }
        
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

    event(contract, method, valObj, filterObject): Promise<any> {
        return new bb.Promise((resolve, reject) => {
            contract[method](valObj, filterObject, (err, result) => { 
                if(err) reject(err);
                else resolve(result);
            });
        });
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
    from: string;
    gasPrice?: string;
    gas?: number;
    value?: number;
}
interface SignOptions {
    privateKey?: string;
}

export {Eth, TransactOptions}