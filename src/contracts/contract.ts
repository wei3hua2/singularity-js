/**
 * @ignore
 */

import {TransactOptions, EventOptions} from '../utils/eth';
import {Account} from '../models/account';
import {PromiEvent} from 'web3-core-promievent';
import {EventEmitter} from 'events';
import {EthUtil} from '../utils/eth';
import {Logger} from '../utils/logger';

const log = Logger.logger();

abstract class Contract {
    account: Account;
    abi: any[];
    network: any;

    contract: any;
    address: string;
    eth: EthUtil;

    isInit: boolean;

    constructor(currentAccount: Account){
        this.account = currentAccount;
        this.eth = currentAccount.eth;
    }

    abstract getAbi(): any[];
    abstract getNetworkObj(): any;

    async init():Promise<boolean> {
        if(!this.isInit) {
            log.debug('contract.init > getNetworkId ');
            const netId = await this.eth.getNetworkId();
            log.debug('contract.init >> getNetworkId : ' + netId);
            
            const contractInfo = this.getNetworkObj()[netId];
            this.address = contractInfo.address;
            const abi = this.getAbi();

            this.contract = this.eth.getContract(abi, this.address);

            this.isInit = true;
        }

        return this.isInit;
    }
    
    protected async callContract(method: string, ...params: any[]): Promise<any> {
        log.debug(`contract.callContract > eth.call ${method} , ${params}`);
        log.debug(JSON.stringify(params));

        const result = await this.eth.call(this.contract, method, ...params);

        log.debug(`contract.callContract >> eth.call ${result}`);
        log.debug(JSON.stringify(result));

        return result;
    }
    protected transactContract(method: string, txOptions: TransactOptions, ...params: any[]): PromiEvent<any> {
        
        txOptions.from = txOptions.from || this.account.address;

        log.debug(`contract.transactContract > eth.transact ${method} , ${txOptions} , ${params} , ${this.address}`);
        log.debug(JSON.stringify(txOptions));
        log.debug(JSON.stringify(params));

        return this.eth.transact(this.account.privateKey,
            this.contract, method, this.address, txOptions, ...params);
    }

    protected event(method: string, type: string, opts:EventOptions={}): EventEmitter | Promise<any> {
        if (type === 'event') return this.eventContract(method, opts);
        else if (type === 'once') return this.onceContract(method, opts);
        else if (type === 'past') return this.pastEventsContract(method, opts);
        else throw new Error('Event type not found');
    }

    protected eventContract(method: string, opts:EventOptions={}): EventEmitter {
        return this.eth.event(this.contract, method, opts);
    }
    protected onceContract(method: string, opts:EventOptions={}): Promise<any> {
        if(!opts.fromBlock) opts.fromBlock = 'latest';
        if(!opts.toBlock) opts.toBlock = 'latest';
        
        return this.eth.once(this.contract, method, opts);
    }
    protected async pastEventsContract(method: string, opts:EventOptions={}): Promise<any> {
        if(!opts.fromBlock) opts.fromBlock = 0;
        if(!opts.toBlock) opts.toBlock = 'latest';

        log.debug(`contract.pastEventsContract > eth.pastEvents ${method} , ${opts}`);
        log.debug(JSON.stringify(opts));

        const evts = await this.eth.pastEvents(this.contract, method, opts);

        log.debug(`contract.pastEventsContract >> eth.pastEvents ${method} , ${opts}`);
        log.debug(JSON.stringify(evts));

        return evts;
    }
    
    public allEvents = (opt:EventOptions={}) => this.eth.allEvents(this.contract, opt);


    protected fromAscii(strVal: string) : any {
        return this.eth.asciiToHex(strVal);
    }
    protected toUtf8(strVal: string) : any {
        return this.eth.hexToUtf8(strVal);
    }

}


export {Contract}