import {Data} from './index';
import {Registry, Tokens, Mpe} from '../contracts';
import {EthUtil} from '../utils/eth';
import {Grpc} from './grpc';

abstract class Account implements Data {
    address: string;
    privateKey?: string;   
    cogs: number;
    escrowBalances: number;

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
        this.cogs = data['cogs'] || this.cogs;
        this.escrowBalances = data['escrowBalances'] || this.escrowBalances;
    }

    get data(): Object {
        return {
            address: this.address, privateKey: this.privateKey,
            cogs: this.cogs, escrowBalances: this.escrowBalances
        };
    }

    async init(): Promise<Account> {
        if(this.isInit) return this;

        const ethInit = await this.eth.init();
        const tokenSuccess = await this.tokens.init();
        const mpeSuccess = await this.mpe.init();
        const regSuccess = await this.registry.init();

        this.isInit = tokenSuccess && mpeSuccess && regSuccess && ethInit;

        return this;
    }

    abstract getAgiTokens();
    abstract getEscrowBalances();
    abstract getChannels(filter?: any): Promise<any>;

    public toString(): string {
        return `*** Account : ${this.address}` +
            `\ncogs : ${this.cogs} , escrow balances : ${this.escrowBalances}` +
            `\ninit : ${this.isInit} `;
    }
}

interface InitOptions {
    address?: string;
    privateKey?: string;
    ethereum?: any;
}


export {Account, InitOptions}