/**
 * @module account
 */

import {EthUtil, TransactOptions} from './eth';
import {Registry} from './contracts/registry';
import {Tokens} from './contracts/tokens';
import {Mpe} from './contracts/mpe';
import {Marketplace} from './marketplace';


class Account {
    private privateKey: string;
    public address: string;

    protected _registry:Registry;
    protected _mpe:Mpe;
    protected _tokens:Tokens;
    protected _marketplace:Marketplace;
    protected web3:any;

    public _eth:EthUtil;

    constructor(web3:any, opts:InitOptions={}){
        this.web3 = web3;
        this.privateKey = opts.privateKey;
        this.address = opts.address;

        this._eth = new EthUtil(web3);

        this._tokens = new Tokens(this);
        this._mpe = new Mpe(this);
        this._registry = new Registry(this);
        this._marketplace = new Marketplace(this._eth);
    }

    async init(): Promise<boolean> {
        const tokenSuccess = await this._tokens.init();
        const mpeSuccess = await this._mpe.init();
        const regSuccess = await this._registry.init();

        return tokenSuccess && mpeSuccess && regSuccess;
    }

    public getEthUtil = ():EthUtil => this._eth;
    public getRegistry = (): Registry => this._registry;
    public getMpe = (): Mpe => this._mpe;
    public getTokens = (): Tokens => this._tokens;

    public getPrivateKey = (): string => this.privateKey;

    ///////// call

    public async getAgiTokens(): Promise<number> {
        const result = await this._tokens.balanceOf(this.address);
        return result;
    }
    public async getEscrowBalances(): Promise<number> {
        return await this._mpe.balances(this.address);
    }

    ///////// transact

    public async transfer(to:string|Account, amount:number,opts:TransactOptions={}): Promise<any> {
        const toStr = to instanceof Account ? to.address : to;
        opts.from = this.address;
        return await this._tokens.transfer(toStr, amount, opts);
    }
    public async depositToEscrow(amount:number, opts:TransactOptions={}): Promise<any> {
        opts.from = this.address;
        return await this._mpe.deposit(amount, opts);
    }
    public async withdrawFromEscrow(amount:number, opts:TransactOptions={}): Promise<any> {
        opts.from = this.address;
        return await this._mpe.withdraw(amount, opts);
    }

    public async openChannel(){}
    public async depositAndOpenChannel(){}
    public async extendChannel(){}
    public async extendChannelExpiration(){}
    public async transferEscrow(){}
    public async addFundsToChannel(){}
    public async extendsAndAddFundsToChannel(){}


    ///////// event

    // listenChannelOpen
    // listenChannelExtend
    // listenChannelAddFunds
    // listenChannelDeposit
    // listenChannelWithdraw
    // listenChannelTransfer

    // listenTransfer


    public static async create(web3:any, opts:InitOptions={}): Promise<Account> {
        const acct = new Account(web3, opts);
        await acct.init();
        
        return acct;
    }

}

interface InitOptions {
    address?: string;
    privateKey?: string;
}

export {Account}