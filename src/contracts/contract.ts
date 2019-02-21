/**
 * @ignore
 */

import {TransactOptions, EventOptions, AllEventsOptions} from '../eth';
import {Account} from '../account';
import {PromiEvent} from 'web3-core-promievent';
import {EventEmitter} from 'events';
import {EthUtil} from '../eth';

abstract class Contract {
    account: Account;
    abi: any[];
    network: any;

    contract: any;
    address: string;
    eth: EthUtil;

    constructor(currentAccount: Account){
        this.account = currentAccount;
        this.eth = currentAccount.getEthUtil();
    }

    abstract getAbi(): any[];
    abstract getNetworkObj(): any;

    async init():Promise<boolean> {
        const netId = await this.eth.getNetworkId();
        
        const contractInfo = this.getNetworkObj()[netId];
        this.address = contractInfo.address;
        const abi = this.getAbi();

        this.contract = this.eth.getContract(abi, this.address);

        return true;
    }
    
    protected callContract(method: string, ...params: any[]): Promise<any> {
        return this.eth.call(this.contract, method, ...params);
    }
    protected transactContract(method: string, txOptions: TransactOptions, ...params: any[]): PromiEvent<any> {
        return this.eth.transact(
            this.account.getPrivateKey(),
            this.contract, method, this.address, txOptions, ...params);
    }

    protected eventContract(method: string, opts:EventOptions={}): EventEmitter {
        return this.eth.event(this.contract, method, opts);
    }
    protected onceContract(method: string, opts:EventOptions={}): Promise<any> {
        return this.eth.once(this.contract, method, opts);
    }
    protected pastEventsContract(method: string, opts:EventOptions={}): Promise<any> {
        return this.eth.pastEvents(this.contract, method, opts);
    }
    
    public allEvents = (opt:AllEventsOptions={}) => this.eth.allEvents(this.contract, opt);


    protected fromAscii(strVal: string) : any {
        return this.eth.asciiToHex(strVal);
    }
    protected toUtf8(strVal: string) : any {
        return this.eth.hexToUtf8(strVal);
    }

}


export {Contract}