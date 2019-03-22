import {SnetError, ERROR_CODES} from '../errors/snet-error';
import {ChannelSvc} from './channel';
import {Channel, ChannelState} from '../models/channel';
import {Account} from '../models/account';
import {RunJobOptions, RUN_JOB_STATE} from '../models/options';
import {ServiceMetadata, Service,  
        ServiceHeartbeat, ServiceInfo, ServiceFieldInfo} from '../models/service';
import {PromiEvent} from 'web3-core-promievent';
import {CONFIG} from '../configs/config';


abstract class SvcRunJob {
    price: number;
    account: Account;
    paymentExpirationThreshold: number;

    async __runJob(startTime:number, all_events:Object, jobPromise: PromiEvent<any>, 
        method: string, request: Object, channel: Channel, opts: RunJobOptions): Promise<Object> {
     
        // 1. Resolve channel
        opts = Object.assign({}, opts, await this.handleExpirationOpts(opts));
        jobPromise.emit(RUN_JOB_STATE.debug_update_options, opts);

        const resolved = await this._runJobResolveChannel(jobPromise, channel, opts);
        jobPromise.emit(RUN_JOB_STATE.resolved_channel, resolved.channel.data);


        // 2. Stablize channel
        let state = {id:resolved.channel.id, nonce: 0, signedAmount: 0};
        if(!resolved.isNew) {
            const channelState = await resolved.channel.getChannelState(jobPromise); 
            jobPromise.emit(RUN_JOB_STATE.reply_channel_state, channelState.data);
                
            opts = Object.assign({}, opts, await this.handleAmountOpts(opts, channelState));
            jobPromise.emit(RUN_JOB_STATE.debug_update_options, opts);

            await this._runJobStablizeChannel(jobPromise, resolved.channel, opts);

            state.nonce = channelState.currentNonce;
            state.signedAmount = channelState.currentSignedAmount;
        }
            
        // 3. Service call
        const response = await this._runJobServiceCall(jobPromise, state, method, request);        

        const timeDiff = (Date.now() - startTime) / 1000.0;
        jobPromise.emit(RUN_JOB_STATE.stats, await this.jobSummary(all_events, timeDiff));

        return response;
    }
    async _runJobResolveChannel(jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions): Promise<{isNew:boolean, channel:Channel}> {
        
        let _newOpenChannel: boolean = false, result = channel;

        jobPromise.emit(RUN_JOB_STATE.request_available_channels, true);
        const channels = await this.getChannels();
        jobPromise.emit(RUN_JOB_STATE.reply_available_channels, channels.map(c => c.data));

        if(!result) result = this.findLargestChannel(channels);
        else if(!channels.some(c => result.id === c.id)) 
            throw new SnetError(ERROR_CODES.runjob_no_channel_found, result.id);
        
        if(opts.autohandle_channel && !result) {
            const channel_topup_expiration = opts.channel_topup_expiration;
            const channel_topup_amount = opts.channel_topup_amount || this.price; 

            if(opts.autohandle_escrow){
                const escrowCondition = {
                    min_amount: opts.escrow_min_amount || this.price,
                    topup_amount: opts.escrow_topup_amount || this.price};
                await this.topupEscrow(jobPromise, escrowCondition, opts.autohandle_escrow);
            }

            result = await this.openChannel(channel_topup_amount, channel_topup_expiration, jobPromise);

            _newOpenChannel = true;
        }
        else if(!opts.autohandle_channel && !result)
            throw new SnetError(ERROR_CODES.runjob_no_channel_found, {});

        await result.init();

        return {isNew: _newOpenChannel, channel: result};
    }
    async _runJobStablizeChannel(jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions): Promise<void> {

        let validity = await this.validateChannel(channel, opts);

        jobPromise.emit(RUN_JOB_STATE.checked_channel_validity, {options:opts, validity:validity});

        if(opts.autohandle_channel) 
            await this.topupChannel(jobPromise, validity, channel, opts);
        else
            throw new SnetError(ERROR_CODES.runjob_insufficient_fund_expiration, validity);
        
    }
    async _runJobServiceCall(jobPromise:PromiEvent, 
        state:{id:number, nonce:number, signedAmount:number}, method:string, request:Object): Promise<Object> {
        
        const grpcHeader = await this.handleRequestHeader(state.id, state.nonce, state.signedAmount);
        
        jobPromise.emit(RUN_JOB_STATE.request_svc_call, {header: grpcHeader, body: request});

        const result = await this.invokeService(jobPromise, grpcHeader, method, request);

        jobPromise.emit(RUN_JOB_STATE.reply_svc_call, result);

        return result;
    }
    async jobSummary(allEvents: Object, timeTaken:number): Promise<Object> {

        const summary = {};

        let txs = [ allEvents['reply_new_channel'], allEvents['reply_escrow_approve_allowance'],
                    allEvents['reply_escrow_deposit'], allEvents['reply_channel_extend_and_add_funds'],
                    allEvents['reply_channel_add_funds'], allEvents['reply_channel_extend_expiration'] ];
        txs = txs.filter(tx => !!tx);
        txs = txs.map(tx => ({
            method:tx.method,
            gasUsed:tx.receipt.gasUsed, cumulativeGasUsed:tx.receipt.cumulativeGasUsed, 
            transactionHash:tx.receipt.transactionHash, blockNumber:tx.receipt.blockNumber, 
            estmatedGas:tx.transaction.gas, blockHash:tx.receipt.blockHash, 
            gasPrice:tx.transaction.gasPrice, gasLimit:tx.transaction.gasLimit }));
        
            
        summary['txs'] = txs;
        summary['time_taken'] = timeTaken;
        summary['total_tx'] = txs.length;
        summary['total_gas'] = txs.reduce((acc, tx) => acc+ this.account.eth.hexToNumber(tx.gasUsed), 0 );

        const header = allEvents['request_svc_call'].header;
        summary['channel_id'] = header['snet-payment-channel-id'];
        summary['channel_nonce'] = header['snet-payment-channel-nonce'];
        summary['channel_signed_amount'] = header['snet-payment-channel-amount'];

        summary['request'] = allEvents['request_svc_call'].body;
        summary['response'] = allEvents['reply_svc_call'];

        summary['escrow'] = await this.account.getEscrowBalances({inCogs:true});
        summary['agi'] = await this.account.getAgiTokens({inCogs:true});
        
        const channel = await ChannelSvc.retrieve(this.account, summary['channel_id']);
        summary['channel_value'] = channel.value;

        return summary;
    }

    abstract openChannel(amount:number, expiration: number, jobPromi?: PromiEvent): Promise<any>;
    abstract getChannels(opts?:{init:boolean}): Promise<Channel[]>;
    abstract invokeService(jobPromise, header:Object, method:string, request:Object): Promise<Object>;
    abstract resolveChannelAndOptions(channelOrOpts:Channel|RunJobOptions, opts?:RunJobOptions): [Channel, RunJobOptions];
    abstract handleRequestHeader(channelId:number, nonce:number, signedAmount:number): Promise<Object>;
    abstract topupEscrow(jobPromise:PromiEvent, opts: {min_amount:number, topup_amount}, autohandleEscrow:boolean): Promise<any>;
    abstract topupChannel (jobPromise, validity:Object, channel:Channel, opts: RunJobOptions): Promise<any>;


    
    async handleExpirationOpts (opts: RunJobOptions): Promise<Object> {
        const result = {
            channel_topup_expiration: opts.channel_topup_expiration,
            channel_min_expiration: opts.channel_min_expiration
        };
        
        const currentBlockNo = await this.account.eth.getBlockNumber();

        if(!opts.channel_topup_expiration) 
            result.channel_topup_expiration = currentBlockNo + this.paymentExpirationThreshold + CONFIG.EXPIRATION_BLOCK_TOPUP_OFFSET;

        if(!opts.channel_min_expiration) 
            result.channel_min_expiration = currentBlockNo + this.paymentExpirationThreshold + CONFIG.EXPIRATION_BLOCK_MIN_OFFSET;

        this.validateExpirationOpts(result, currentBlockNo);

        return result;
    }
    validateExpirationOpts(expire:Object, currentBlock:number): void {
        const minExpiry = currentBlock + this.paymentExpirationThreshold + CONFIG.EXPIRATION_BLOCK_MIN_OFFSET;
        
        if(expire['channel_min_expiration'] < minExpiry)
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_expiry_options, 
                `minimum expiration does not meet required level. min = ${minExpiry} , channel_min_expiration = ${expire['channel_min_expiration']}`);
        
        else if(expire['channel_topup_expiration'] < expire['channel_min_expiration'])
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_expiry_options,
                `channel topup expiration is lower than min expiration. channel_min_expiration =  ${expire['channel_min_expiration']} , channel_topup_expiration = ${expire['channel_topup_expiration']}`);
        
        else if(expire['channel_topup_expiration'] < minExpiry)
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_expiry_options,
                `channel topup expiration does not meet required level. min = ${minExpiry} , channel_topup_expiration = ${expire['channel_topup_expiration']}`);

    }

    async handleAmountOpts(opts: RunJobOptions, channelState:ChannelState): Promise<Object> {
        const result = {
            channel_topup_amount: opts.channel_topup_amount, channel_min_amount: opts.channel_min_amount,
            escrow_topup_amount: opts.escrow_topup_amount, escrow_min_amount: opts.escrow_min_amount};
        
        if(opts.channel_topup_amount && opts.channel_min_amount) return result;

        const signedAmount = channelState.currentSignedAmount || 0;

        if(!opts.channel_min_amount)
            result.channel_min_amount = signedAmount + this.price;

        if(!opts.channel_topup_amount) 
            result.channel_topup_amount = result.channel_min_amount;

        if(!opts.escrow_min_amount)
            result.escrow_min_amount = result.channel_min_amount;

        if(!opts.escrow_topup_amount) 
            result.escrow_topup_amount = result.escrow_min_amount;

        
        this.validateAmountOpts(result, signedAmount, this.price);

        const escrowBalance = await this.account.getEscrowBalances({inCogs:true});
        
        this.validateEscrowAmountOpts(
            {min_amount: result.escrow_min_amount, topup_amount: result.escrow_topup_amount}, 
            opts.autohandle_escrow, escrowBalance,
            signedAmount, this.price);
        
        return result;
    }
    validateAmountOpts(amount:Object, signedAmount:number, svcPrice:number): void {
        const minAmount = signedAmount + svcPrice * 1;

        if(amount['channel_min_amount'] < minAmount)
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_amount_options, 
                `minimum amount does not meet required level. min = ${minAmount} , channel_min_amount = ${amount['channel_min_amount']}`);
        
        else if(amount['channel_topup_amount'] < amount['channel_min_amount'])
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_amount_options,
                `topup amount is lower than min amount. channel_min_amount = ${amount['channel_min_amount']} , channel_topup_amount = ${amount['channel_topup_amount']}`);
        
        else if(amount['channel_topup_amount'] < minAmount)
            throw new SnetError(ERROR_CODES.runjob_invalid_channel_amount_options,
                `topup amount does not meet required level. min = ${minAmount} , channel_topup_amount = ${amount['channel_topup_amount']}`);
    }
    validateEscrowAmountOpts(amount:{min_amount:number, topup_amount:number}, 
        autohandleEscrow:boolean, escrowBalance:number, signedAmount:number, svcPrice:number): void {
        const minAmount = signedAmount + svcPrice * 1;

        if(!autohandleEscrow && escrowBalance < minAmount)
            throw new SnetError(ERROR_CODES.runjob_insufficient_fund_escrow, 
                `Insufficient escrow fund. required = ${minAmount} , current_balance = ${escrowBalance}`);

        if(amount.min_amount < minAmount)
            throw new SnetError(ERROR_CODES.runjob_invalid_escrow_amount_options, 
                `minimum amount does not meet required level. min = ${minAmount} , escrow_min_amount = ${amount.min_amount}`);
        
        else if(amount.topup_amount < amount.min_amount)
            throw new SnetError(ERROR_CODES.runjob_invalid_escrow_amount_options,
                `topup amount is lower than min amount. escrow_min_amount = ${amount.min_amount} , escrow_topup_amount = ${amount.topup_amount}`);
        
        else if(amount.topup_amount < minAmount)
            throw new SnetError(ERROR_CODES.runjob_invalid_escrow_amount_options,
                `topup amount does not meet required level. min = ${minAmount} , escrow_topup_amount = ${amount.topup_amount}`);
    }

    async validateChannel(channel:Channel, opts: RunJobOptions): Promise<any> {
        const validity = {};
        // const escrowAmount = await this.account.getEscrowBalances({inCogs:true});

        // if(escrowAmount < opts.escrow_min_amount)
        //     validity['not_enough_in_escrow'] = [escrowAmount, opts.escrow_topup_amount];

        if(channel.value < opts.channel_min_amount)
            validity['channel_lessthan_topup_amount'] = [channel.value, opts.channel_topup_amount];

        if(channel.expiration < opts.channel_min_expiration)
            validity['channel_lessthan_topup_expiration'] = [channel.expiration, opts.channel_topup_expiration];

        return validity;
    }

    findLargestChannel(channels:Channel[]): Channel {
        let channel = null;

        if(!channels || channels.length === 0) return channel;
        else if(channels.length > 0) {
            channel = channels.reduce((acc, c) => {
                if(c.id > acc.id) return c;
                else return acc;
            }, channels[0]);
        }

        return channel;
    }

}


export {SvcRunJob}