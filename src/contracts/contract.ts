/**
 * @ignore
 */

import {Eth, TransactOptions} from '../eth';

abstract class Contract {
    eth: Eth;
    web3Version: string;
    abi: any[];
    network: any;

    constructor(eth: Eth){
        this.eth = eth;
    }

    abstract getAbi(): any[];
    abstract getNetworkObj(): any;

    protected async callContract(method: string, ...params: any[]): Promise<any> {
        const contract = await this.getContract();
        return this.eth.call(contract, method, ...params);
    }
    protected async transactContract(method: string, txOptions: ContractTxOptions, ...params: any[]): Promise<any> {
        const contract = await this.getContract();
        if(txOptions.signTx) txOptions.contractAddress = contract.address || contract.options.address;
        
        return this.eth.transact(contract, method, txOptions, ...params);
    }
    protected async eventContract(method: string): Promise<any> {
        const contract = await this.getContract();
        const valObj = {};
        const filterObj = {};
        return this.eth.event(contract, method, valObj, filterObj);
    }

    async getContract(): Promise<any>{
        const address = await this.getNetworkAddress();
        return this.eth.initContract(this.getAbi(), address);
    }

    async getNetworkAddress(): Promise<string> {
        const netId = await this.eth.getNetworkId();
        const contractInfo = this.getNetworkObj()[netId];

        return contractInfo.address;
    }

    protected fromAscii(strVal: string) : any {
        return this.eth.fromAscii(strVal);
    }
    protected toUtf8(strVal: string) : any {
        return this.eth.toUtf8(strVal);
    }
}

interface ContractTxOptions extends TransactOptions {
    signTx?: boolean;
    privateKey?: string;
    contractAddress?: string;
}

export {Contract, ContractTxOptions}