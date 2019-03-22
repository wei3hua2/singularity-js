import {Data} from './index';
import {Registry, Tokens, Mpe} from '../contracts';
import {EthUtil, EventOptions} from '../utils/eth';
import {ChannelSvc, AccountSvc} from '../impls';
import PromiEvent from 'web3-core-promievent';
import {Logger} from '../utils/logger';
const log = Logger.logger();

abstract class Account implements Data {
    address: string;
    privateKey?: string;

    isInit: boolean = false;

    public registry:Registry;
    public mpe:Mpe;
    public tokens:Tokens;
    protected web3:any;
    public eth:EthUtil;

    constructor(web3:any, opts:AccountInitOptions={}) {}

    public abstract init(): Promise<Account>;
    public abstract get data():Object;
    public abstract set data(data:Object);

    abstract getAgiTokens(opts?:{inCogs: boolean}): Promise<number>;
    abstract getEscrowBalances(opts?:{inCogs: boolean}): Promise<number>;
    abstract escrowAllowance(opts?: {inCogs: boolean}): Promise<number>;
    abstract getChannels(opts?: EventOptions, initOpts?: {init:boolean}): Promise<ChannelSvc[]>;

    abstract approveEscrow(amount: number, opts?: {inCogs: boolean}): PromiEvent<any>;
    abstract transfer(to:string|Account, amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;
    abstract depositToEscrow(amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;
    abstract withdrawFromEscrow(amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;

    public static async create(web3:any, opts:AccountInitOptions={}): Promise<Account> {
        const acct = new AccountSvc(web3, opts);
        await acct.init();
        
        return acct;
    }
}

interface AccountInitOptions {
    address?: string;
    privateKey?: string;
    ethereum?: any;
}


export {Account, AccountInitOptions}