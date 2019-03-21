import {Data} from './index';
import {Registry, Tokens, Mpe} from '../contracts';
import {EthUtil, EventOptions} from '../utils/eth';
import {ChannelSvc} from '../impls';
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

    constructor(web3:any, opts:InitOptions={}) {
        this.web3 = web3;
        this.eth = new EthUtil(web3, opts.ethereum);

        this.tokens = new Tokens(this);
        this.mpe = new Mpe(this);
        this.registry = new Registry(this);

        this.data = opts;
    }

    set data(data: Object) {
        this.address = data['address'] || this.address;
        this.privateKey = data['privateKey'] || this.privateKey;
    }

    get data(): Object {
        return {
            address: this.address, privateKey: this.privateKey
        };
    }

    async init(): Promise<Account> {
        if(this.isInit) return this;

        if(!this.address) this.address = (await this.eth.getAccounts())[0];
        log.debug("address = " + this.address);

        const ethInit = await this.eth.init();
        log.debug("eth init");
        const tokenSuccess = await this.tokens.init();
        log.debug("tokens init");
        const mpeSuccess = await this.mpe.init();
        log.debug("mpe init");
        const regSuccess = await this.registry.init();
        log.debug("registry init");

        this.isInit = tokenSuccess && mpeSuccess && regSuccess && ethInit;

        return this;
    }

    abstract getAgiTokens(opts?:{inCogs: boolean}): Promise<number>;
    abstract getEscrowBalances(opts?:{inCogs: boolean}): Promise<number>;
    abstract escrowAllowance(opts?: {inCogs: boolean}): Promise<number>;
    abstract approveEscrow(amount: number, opts?: {inCogs: boolean}): PromiEvent<any>;
    abstract getChannels(opts?: EventOptions, initOpts?: {init:boolean}): Promise<ChannelSvc[]>;
    abstract transfer(to:string|Account, amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;
    abstract depositToEscrow(amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;
    abstract withdrawFromEscrow(amount:number, opts?:{inCogs: boolean}): PromiEvent<any>;

    public toString(): string {
        return `*** Account : ${this.address}` +
            `\ninit : ${this.isInit} `;
    }
}

interface InitOptions {
    address?: string;
    privateKey?: string;
    ethereum?: any;
}


export {Account, InitOptions}