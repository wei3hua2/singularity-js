import {Account, Data, AccountInitOptions} from '../models';
import {Registry, Tokens, Mpe} from '../contracts';
import {EthUtil, EventOptions} from '../utils/eth';
import {ChannelSvc} from './channel';
import * as BbPromise from 'bluebird';
import {PromiEvent} from 'web3-core-promievent';


class AccountSvc extends Account {
    
    constructor(web3:any, opts:AccountInitOptions){
        super(web3, opts);
        this.web3 = web3;
        this.eth = new EthUtil(web3, opts);

        this.tokens = new Tokens(this);
        this.mpe = new Mpe(this);
        this.registry = new Registry(this);

        this.data = opts;
    }

    get clientType(): string {
        return this.eth.clientType;
    }

    async init(): Promise<Account> {
        if(this.isInit) return this;

        if(!this.address) this.address = await this.eth.getAccount();

        const ethInit = await this.eth.init();
        const tokenSuccess = await this.tokens.init();
        const mpeSuccess = await this.mpe.init();
        const regSuccess = await this.registry.init();

        this.isInit = tokenSuccess && mpeSuccess && regSuccess && ethInit;

        return this;
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

    get network(): Promise<string> {
        return this.eth.getNetwork();
    }

    public async getAgiTokens(opts: {inCogs: boolean} = {inCogs:false}):Promise<number> {
        const tokenCogs = await this.tokens.balanceOf(this.address);

        return opts.inCogs ? tokenCogs : this.toAgis(tokenCogs);
    }
    public async getEscrowBalances(opts: {inCogs: boolean} = {inCogs:false}):Promise<number> {
        const tokenCogs = await this.mpe.balances(this.address);

        return opts.inCogs ? tokenCogs : this.toAgis(tokenCogs);
    }
    public async getChannels (
        opts: EventOptions = {filter:{}}, initOpts: {init:boolean} = {init:false}): Promise<ChannelSvc[]> {

        if(!opts.filter) opts.filter = {};
        opts.filter['sender'] = this.address;

        const openChannelsEvents = Array.from(await this.mpe.ChannelOpen('past' , opts));

        const openChannels: ChannelSvc[] = 
            Array.from(await BbPromise.map(openChannelsEvents, 
                (c) => { return ChannelSvc.retrieve(this, c['id'], initOpts.init); }));

        return openChannels;
    }
    public async escrowAllowance(opts: {inCogs: boolean} = {inCogs:false}): Promise<number> {
        const tokenCogs = await this.tokens.allowance(this.address, this.mpe.address);

        return opts.inCogs ? tokenCogs : this.toAgis(tokenCogs);
    }

    ///////// transact

    public approveEscrow(amount: number, opts: {inCogs: boolean} = {inCogs:false}): PromiEvent<any> {
        const cogAmount = opts.inCogs ? amount : this.toCogs(amount);
        return this.tokens.approve(this.mpe.address, cogAmount);
    }

    public transfer(to:string|Account, amount:number, opts: {inCogs: boolean} = {inCogs:false}): PromiEvent<any> {
        const toStr = to instanceof Account ? to.address : to;
        const cogAmount = opts.inCogs ? amount : this.toCogs(amount);

        return this.tokens.transfer(toStr, cogAmount);
    }
    public depositToEscrow(amount:number, opts: {inCogs: boolean} = {inCogs:false}): PromiEvent<any> {
        const cogAmount = opts.inCogs ? amount : this.toCogs(amount);
        return this.mpe.deposit(cogAmount);
    }
    public withdrawFromEscrow(amount:number, opts: {inCogs: boolean} = {inCogs:false}): PromiEvent<any> {
        const cogAmount = opts.inCogs ? amount : this.toCogs(amount);
        return this.mpe.withdraw(cogAmount);
    }

    private toCogs(agi: number): number {
        return Math.floor(agi * 100000000.0);
    }
    private toAgis(cogs: number): number {
        return +((cogs / 100000000.0).toFixed(8));
    }
}

export {AccountSvc}