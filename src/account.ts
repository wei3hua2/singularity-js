/**
 * @module account
 */

import {EthUtil, TransactOptions, EventOptions, AllEventsOptions} from './eth';
import {Registry} from './contracts/registry';
import {Tokens} from './contracts/tokens';
import {Mpe} from './contracts/mpe';
import {Marketplace} from './marketplace';
import {PromiEvent} from 'web3-core-promievent';
import { EventEmitter } from 'events';

class Account {
    private privateKey: string;
    public address: string;
    private isVersion1Beyond: boolean;

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
        

        this.isVersion1Beyond = !(this.getWeb3Version()[0] === '0');
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
    

    getWeb3Version():string {
        return this.web3.version.api ? this.web3.version.api : this.web3.version;
    }


    call(contract, method, ...params): Promise<any> {
        return contract.methods[method](...params).call();
    }

    async transact(contract, method:string, toAddress:string, txOptions:TransactOptions, ...params): Promise<any> {
        const contractMethod = contract.methods[method](...params);

        if(this.privateKey) {
            const signedPayload = await this.signTx(this.privateKey, this.address, toAddress, contractMethod);
            
            return await this.web3.eth.sendSignedTransaction(signedPayload['rawTransaction']);
        } else
            return await contractMethod.send(txOptions);
        
    }

    async signTx (privateKey: string, from:string, to:string, method:any): Promise<string> {
        const nonce = await this.web3.eth.getTransactionCount(from);
        const gas = await method.estimateGas({from:from});
        let tx = {nonce:this._eth.toHex(nonce), 
            from:from, to:to, 
            gas:this._eth.toHex(gas), gasLimit: this._eth.toHex(800000),
            gasPrice: this._eth.toHex(this.web3.utils.toWei('10', 'gwei')),
            data: method.encodeABI()};

        return this.web3.eth.accounts.signTransaction(tx, privateKey);
    }

    once(contract, method, opts:EventOptions={}): Promise<any> {
        return new Promise((resolve, reject) => {
            contract.once(method,opts, (err, evt) => {
                if(err) reject(err);
                else resolve(evt);
            });
        });
    }
    event(contract, method, opts:EventOptions={}): EventEmitter {
        return contract.events[method](opts);
    }
    pastEvents(contract, method, opts:AllEventsOptions={}): Promise<any> {
        return contract.getPastEvents(method, opts);
    }
    allEvents(contract, opts:AllEventsOptions={}): Promise<any> {
        return new Promise((resolve, reject) => {
            contract.events.allEvents(opts, (err, evts) => {
                if(err) reject(err);
                else resolve(evts);
            });
        });
    }


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