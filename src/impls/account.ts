/**
 * @module account
 */

import {Account, Data} from '../models';
import {InitOptions} from '../models/account';
import {EthUtil, TransactOptions} from '../utils/eth';

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
    public getChannels (filter: any = {}): Promise<any> {
        filter.sender = this.address;
        return <Promise<any>> this.mpe.ChannelOpen('past' , filter);
    }

    ///////// transact

    public transfer(to:string|AccountSvc, amount:number,opts:TransactOptions={}): PromiEvent<any> {
        const toStr = to instanceof AccountSvc ? to.address : to;
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
    public async openChannel(recipient:string, groupId:string, 
        value:number, expiration:number, opts:TransactOptions={}): PromiEvent<any> {
        opts.from = this.address;
        return this.mpe.openChannel(this.address, recipient, groupId, value, expiration, opts);
    }
    public async depositAndOpenChannel(recipient:string, 
        groupId:string,value:number, expiration:number,txOpt:TransactOptions={}){
        return this.mpe.depositAndOpenChannel(this.address, recipient, groupId, value, expiration, txOpt);
    }
    public async extendChannel(channelId:number, newExpiration:number, txOpt:TransactOptions={}){
        return this.mpe.channelExtend(channelId, newExpiration, txOpt);
    }
    public async extendChannelExpiration(channelId:number, newExpiration:number, txOpt:TransactOptions={}){
        return this.mpe.channelExtend(channelId, newExpiration, txOpt);
    }
    // public async transferEscrow(){}
    public async addFundsToChannel(channelId:number, amount:number, txOpt:TransactOptions={}){
        return this.mpe.channelAddFunds(channelId, amount, txOpt);
    }
    public async extendsAndAddFundsToChannel(channelId:number, newExpiration:number, amount:number, txOpt:TransactOptions={}){
        return this.mpe.channelExtendAndAddFunds(channelId, newExpiration, amount, txOpt);
    }


    ///////// event

    // listenChannelOpen
    // listenChannelExtend
    // listenChannelAddFunds
    // listenChannelDeposit
    // listenChannelWithdraw
    // listenChannelTransfer

    // listenTransfer


    public static async create(web3:any, opts:InitOptions={}): Promise<AccountSvc> {
        const acct = new AccountSvc(web3, opts);
        await acct.init();
        
        return acct;
    }

}

export {AccountSvc}