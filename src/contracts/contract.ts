/**
 * @ignore
 */

import {TransactOptions} from '../eth';
import {Account} from '../account';

abstract class Contract {
    account: Account;
    abi: any[];
    network: any;

    constructor(currentAccount: Account){
        this.account = currentAccount;
    }

    abstract getAbi(): any[];
    abstract getNetworkObj(): any;

    async getContract(): Promise<any>{
        const address = await this.getNetworkAddress();
        const abi = this.getAbi();

        return this.account.getEthUtil().getContract(abi, address);
    }

    async getNetworkAddress(): Promise<string> {
        const netId = await this.account.getEthUtil().getNetworkId();
        const contractInfo = this.getNetworkObj()[netId];

        return contractInfo.address;
    }
    
    protected async callContract(method: string, ...params: any[]): Promise<any> {
        const contract = await this.getContract();
        return this.account.call(contract, method, ...params);
    }
    protected async transactContract(method: string, txOptions: TransactOptions, ...params: any[]): Promise<any> {
        const contract = await this.getContract();
        const toAddress = await this.getNetworkAddress();
        return this.account.transact(contract, method, toAddress, txOptions, ...params);
    }
    protected async eventContract(method: string): Promise<any> {
        const contract = await this.getContract();
        const valObj = {};
        const filterObj = {};
        return this.account.event(contract, method, valObj, filterObj);
    }
    


    protected fromAscii(strVal: string) : any {
        return this.account.getEthUtil().fromAscii(strVal);
    }
    protected toUtf8(strVal: string) : any {
        return this.account.getEthUtil().toUtf8(strVal);
    }
}


export {Contract}