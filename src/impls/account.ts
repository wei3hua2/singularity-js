/**
 * @module account
 */

import {Account, Data} from '../models';
import {InitOptions} from '../models/account';
import {TransactOptions, EventOptions} from '../utils/eth';
import {ChannelSvc} from './channel';

import {PromiEvent} from 'web3-core-promievent';

class AccountSvc extends Account {
    
    private constructor(web3:any, opts:InitOptions={}){
        super(web3, opts);
    }

    ///////// call

    get network(): Promise<string> {
        return this.eth.getNetwork();
    }

    public getAgiTokens():Promise<number> {
        return this.tokens.balanceOf(this.address);
    }
    public getEscrowBalances():Promise<number> {
        return this.mpe.balances(this.address);
    }
    public async getChannels (opts: EventOptions = {filter:{}}): Promise<ChannelSvc[]> {
        opts.filter['sender'] = this.address;
        const openChannelsEvents = Array.from(await this.mpe.ChannelOpen('past' , opts));
        
        const openChannels:ChannelSvc[] = openChannelsEvents.map((c) => {
            c['value'] = c['amount'];
            delete c['amount'];
            return ChannelSvc.init(this, c['id'], c);
        });

        return Array.from(openChannels);
    }
    // public allowance(sender: string|Account): Promise<number> {
    //     const toStr = sender instanceof Account ? sender.address : sender;
    //     return this.tokens.allowance(this.address, toStr);
    // }
    public escrowAllowance(): Promise<number> {
        return this.tokens.allowance(this.address, this.mpe.address);
    }

    ///////// transact

    // public approve(sender: string|Account, amount: number, opts:TransactOptions={}): PromiEvent<any> {
    //     const toStr = sender instanceof Account ? sender.address : sender;
    //     opts.from = this.address;
    //     return this.tokens.approve(toStr, amount, opts);
    // }
    public approveEscrow(amount: number, opts: TransactOptions={}): PromiEvent<any> {
        opts.from = this.address;
        return this.tokens.approve(this.mpe.address, amount, opts);
    }

    public transfer(to:string|Account, amount:number,opts:TransactOptions={}): PromiEvent<any> {
        const toStr = to instanceof Account ? to.address : to;
        opts.from = this.address;
        return this.tokens.transfer(toStr, amount, opts);
    }
    public depositToEscrow(amount:number, opts:TransactOptions={}): PromiEvent<any> {
        opts.from = this.address;
        return this.mpe.deposit(amount, opts);
    }
    public withdrawFromEscrow(amount:number, opts:TransactOptions={}): PromiEvent<any> {
        opts.from = this.address;
        return this.mpe.withdraw(amount, opts);
    }

    ///////// event


    public static async create(web3:any, opts:InitOptions={}): Promise<AccountSvc> {
        const acct = new AccountSvc(web3, opts);
        await acct.init();
        
        return acct;
    }

}

export {AccountSvc}