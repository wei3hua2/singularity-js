/**
 * @module account
 */

import {Account, Data} from '../models';
import {InitOptions} from '../models/account';
import {TransactOptions, EventOptions} from '../utils/eth';
import {ChannelSvc} from './channel';
import * as BbPromise from 'bluebird';
import {PromiEvent} from 'web3-core-promievent';


class AccountSvc extends Account {
    
    private constructor(web3:any, opts:InitOptions={}){
        super(web3, opts);
    }

    ///////// call

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

    ///////// event


    public static async create(web3:any, opts:InitOptions={}): Promise<AccountSvc> {
        const acct = new AccountSvc(web3, opts);
        await acct.init();
        
        return acct;
    }

}

export {AccountSvc}