/**
 * @module account
 */

import {Registry} from './contracts/registry';
import {Eth} from './eth';
import {Model} from './model';
import {ContractTxOptions} from './contracts/contract';

class Account extends Model{
    private _privateKey: string;

    constructor(web3:any, fields:any, opts:any={}){
        super(web3, fields);
        
        this._privateKey = opts.privateKey;
    }

    public async fetch(){ return false; }

    public async getAgiTokens(): Promise<number> {
        return await this._tokens.balanceOf(this.id);
    }
    public async getEscrowBalances(): Promise<number> {
        return await this._mpe.balances(this.id);
    }

    public async transfer(to:string|Account, amount:number,opts:ContractTxOptions={from:null}): Promise<any> {
        const toStr = to instanceof Account ? to.id : to;
        return await this._tokens.transfer(toStr, amount, this.parseOptions(opts));
    }

    public async depositToEscrow(amount:number, opts:ContractTxOptions={from:null}): Promise<any> {
        return await this._mpe.deposit(amount, this.parseOptions(opts));
    }
    public async withdrawFromEscrow(amount:number, opts:ContractTxOptions={from:null}): Promise<any> {
        return await this._mpe.withdraw(amount, this.parseOptions(opts));
    }



    public static create(web3:any, fields:any, opts:InitOptions={}): Account {
        return new Account(web3, fields, opts);
    }
    public static async getCurrentAccounts(web3:any): Promise<Account[]> {
        const registry = await new Registry(new Eth(web3));
        const ethAccts = await registry.eth.getAccounts();
        
        return ethAccts.map((acct) => new Account(web3, {id:acct}));
    }

    private parseOptions (opts:ContractTxOptions) : ContractTxOptions {
        const tx = !!this._privateKey || !!opts.privateKey;
        const pk = opts.privateKey || this._privateKey;
        const from = this.id;

        return {from: from, privateKey: pk, signTx:tx};
    }
}

interface InitOptions {
    privateKey?: string;
}

export {Account}