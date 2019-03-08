import {Data} from './index';
import {Registry, Tokens, Mpe} from '../contracts';
import {EthUtil, TransactOptions} from '../utils/eth';
import PromiEvent from 'web3-core-promievent';

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

        const ethInit = await this.eth.init();
        const tokenSuccess = await this.tokens.init();
        const mpeSuccess = await this.mpe.init();
        const regSuccess = await this.registry.init();

        this.isInit = tokenSuccess && mpeSuccess && regSuccess && ethInit;

        return this;
    }

    abstract getAgiTokens(): Promise<number>;
    abstract getEscrowBalances(): Promise<number>;
    // abstract allowance(sender: string): Promise<number>;
    abstract escrowAllowance(): Promise<number>;
    abstract getChannels(filter?: any): Promise<Object[]>;
    // abstract approve(spender: string, value: number, txOpt?:TransactOptions);
    abstract transfer(to:string|Account, amount:number,opts?:TransactOptions): PromiEvent<any>;
    abstract depositToEscrow(amount:number, opts?:TransactOptions): PromiEvent<any>;
    abstract withdrawFromEscrow(amount:number, opts?:TransactOptions): PromiEvent<any>;

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