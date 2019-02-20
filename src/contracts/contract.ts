/**
 * @ignore
 */

import {TransactOptions, EventOptions, AllEventsOptions} from '../eth';
import {Account} from '../account';
import { EventEmitter } from 'events';

abstract class Contract {
    account: Account;
    abi: any[];
    network: any;

    contract: any;
    address: string;

    constructor(currentAccount: Account){
        this.account = currentAccount;
    }

    abstract getAbi(): any[];
    abstract getNetworkObj(): any;

    async init():Promise<boolean> {
        const netId = await this.account.getEthUtil().getNetworkId();
        
        const contractInfo = this.getNetworkObj()[netId];
        this.address = contractInfo.address;
        const abi = this.getAbi();

        this.contract = this.account.getEthUtil().getContract(abi, this.address);

        return true;
    }
    
    protected callContract(method: string, ...params: any[]): Promise<any> {
        return this.account.call(this.contract, method, ...params);
    }
    protected transactContract(method: string, txOptions: TransactOptions, ...params: any[]): Promise<any> {
        return this.account.transact(this.contract, method, this.address, txOptions, ...params);
    }

    protected eventContract(method: string, opts:EventOptions={}): EventEmitter {
        return this.account.event(this.contract, method, opts);
    }
    protected onceContract(method: string, opts:EventOptions={}): Promise<any> {
        return this.account.once(this.contract, method, opts);
    }
    protected pastEventsContract(method: string, opts:EventOptions={}): Promise<any> {
        return this.account.pastEvents(this.contract, method, opts);
    }
    
    public allEvents = (opt:AllEventsOptions={}) => this.account.allEvents(this.contract, opt);


    protected fromAscii(strVal: string) : any {
        return this.account.getEthUtil().fromAscii(strVal);
    }
    protected toUtf8(strVal: string) : any {
        return this.account.getEthUtil().toUtf8(strVal);
    }
}


export {Contract}