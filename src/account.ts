/**
 * @module Account
 */

import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {Tokens} from './contracts/tokens';
import {SnetError} from './errors/snet-error';
import {CoreModel} from './core-model';
import {cogsToAgi} from './utils/conversion'
import {ContractTxOptions} from './contracts/contract';

class Account extends CoreModel{
    private _tokens:Tokens;
    private _privateKey: string;

    constructor(registry:Registry, mpe:Mpe, tokens:Tokens, fields:any, opts:any={}){
        super(registry, mpe, fields);
        
        this._tokens = tokens;
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



    public static create(registry:Registry, mpe:Mpe, tokens:Tokens, fields:any, opts:InitOptions={}): Account {
        return new Account(registry, mpe, tokens, fields,opts);
    }
    public static async getCurrentAccounts(registry:Registry, mpe:Mpe, tokens:Tokens): Promise<Account[]> {
        const ethAccts = await registry.eth.getAccounts();
        return ethAccts.map((acct) => new Account(registry, mpe, tokens, {id:acct}));
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