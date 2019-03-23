import {SnetError, ERROR_CODES} from '../errors/snet-error';
import {ChannelSvc} from './channel';
import {Channel, ChannelState} from '../models/channel';
import {Account} from '../models/account';
import {RunJobOptions, RUN_JOB_STATE, InitOptions} from '../models/options';
import {TopupOptions} from '../models/service';
import {PromiEvent} from 'web3-core-promievent';
import {CONFIG} from '../configs/config';


abstract class SvcRunJob {
    price: number;
    account: Account;
    endpoint: string;
    paymentExpirationThreshold: number;
    DEFAULT_BASIC_OPTS: Object;

    abstract get paymentAddress():string;
    abstract get groupId():string;

    async execJob(jobPromise: PromiEvent<any>, 
        method: string, request: Object, channel: Channel, opts: RunJobOptions): Promise<Object> {
     
        // 1. Resolve channel
        opts = Object.assign({}, opts, await this.handleExpirationOpts(opts));
        jobPromise.emit(RUN_JOB_STATE.debug_update_options, opts);

        const resolved = await this.resolveChannel(jobPromise, channel, opts);
        jobPromise.emit(RUN_JOB_STATE.resolved_channel, resolved.channel.data);


        // 2. Stablize channel
        let state = {id:resolved.channel.id, nonce: 0, signedAmount: 0};
        if(!resolved.isNew) {
            const channelState = await resolved.channel.getChannelState(jobPromise); 
            jobPromise.emit(RUN_JOB_STATE.reply_channel_state, channelState.data);
                
            opts = Object.assign({}, opts, await this.handleAmountOpts(opts, channelState));
            jobPromise.emit(RUN_JOB_STATE.debug_update_options, opts);

            await this.stablizeChannel(jobPromise, resolved.channel, opts);

            state.nonce = channelState.currentNonce;
            state.signedAmount = channelState.currentSignedAmount;
        }
            
        // 3. Service call
        const response = await this.serviceCall(jobPromise, state, method, request);

        return response;
    }
    async resolveChannel(jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions): Promise<{isNew:boolean, channel:Channel}> {
        
        // 1. get a list of channels
        let _newOpenChannel: boolean = false, result = channel;

        jobPromise.emit(RUN_JOB_STATE.request_available_channels, true);
        const channels = await this.getChannels();
        jobPromise.emit(RUN_JOB_STATE.reply_available_channels, channels.map(c => c.data));

        // 2. use param channel, else use from list or create new
        if(!result) result = this._findLargestChannel(channels);
        else if(!channels.some(c => result.id === c.id)) 
            throw new SnetError(ERROR_CODES.runjob_no_channel_found, result.id);
        
        if(opts.autohandle_channel && !result) {
            const channel_topup_expiration = opts.channel_topup_expiration;
            const channel_topup_amount = opts.channel_topup_amount || this.price;

            jobPromise.emit(RUN_JOB_STATE.request_new_channel, [this.account.address, this.paymentAddress, this.groupId, channel_topup_amount, channel_topup_expiration]);
            result = await this.openChannel(channel_topup_amount, channel_topup_expiration);
            jobPromise.emit(RUN_JOB_STATE.reply_new_channel, result.data);

            _newOpenChannel = true;
        }
        else if(!opts.autohandle_channel && !result)
            throw new SnetError(ERROR_CODES.runjob_no_channel_found, {});


        // 3. init resolved channel
        await result.init();

        return {isNew: _newOpenChannel, channel: result};
    }
    async stablizeChannel(jobPromise:PromiEvent, channel:Channel, opts:RunJobOptions): Promise<void> {

        let validity = await this.validateChannel(channel, opts);

        jobPromise.emit(RUN_JOB_STATE.checked_channel_validity, {options:opts, validity:validity});

        if(opts.autohandle_channel) 
            await this.topupChannel(validity, channel, 
                {min_amount: opts.channel_min_amount, topup_amount: opts.channel_topup_amount}, jobPromise);
        else
            throw new SnetError(ERROR_CODES.runjob_insufficient_fund_expiration, validity);
        
    }
    async serviceCall(jobPromise:PromiEvent, 
        state:{id:number, nonce:number, signedAmount:number}, method:string, request:Object): Promise<Object> {
        
        const grpcHeader = await this.handleRequestHeader(state.id, state.nonce, state.signedAmount);
        
        jobPromise.emit(RUN_JOB_STATE.request_svc_call, {header: grpcHeader, body: request});

        const result = await this.invokeService(jobPromise, grpcHeader, method, request);

        jobPromise.emit(RUN_JOB_STATE.reply_svc_call, result);

        return result;
    }


    // registry
    abstract openChannel(amount:number, expiration: number, jobPromi?: PromiEvent): Promise<any>;
    abstract getChannels(opts?:InitOptions): Promise<Channel[]>;

    // grpc
    abstract invokeService(jobPromise, header:Object, method:string, request:Object): Promise<Object>;
    abstract handleRequestHeader(channelId:number, nonce:number, signedAmount:number): Promise<Object>;




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
    async handleAmountOpts(opts: RunJobOptions, channelState:ChannelState): Promise<Object> {
        const result = {
            channel_topup_amount: opts.channel_topup_amount, channel_min_amount: opts.channel_min_amount};
        
        if(opts.channel_topup_amount && opts.channel_min_amount) return result;

        const signedAmount = channelState.currentSignedAmount || 0;

        if(!opts.channel_min_amount)
            result.channel_min_amount = signedAmount + this.price;

        if(!opts.channel_topup_amount) 
            result.channel_topup_amount = result.channel_min_amount;

        
        this.validateAmountOpts(result, signedAmount, this.price);
        
        return result;
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
    async topupChannel (validity:Object, channel:Channel, opts: TopupOptions, jobPromise?:PromiEvent): Promise<any> {

        let receipt;
        if(validity['channel_lessthan_topup_amount'] && validity['channel_lessthan_topup_expiration']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_and_add_funds, 
                {   channel: channel.data, expiration: validity['channel_lessthan_topup_expiration'][1], amount: amount });

            receipt = await channel.extendAndAddFunds(validity['channel_lessthan_topup_expiration'][1], amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_and_add_funds, this._mapReceiptForEvent(receipt));
        }
        else if(validity['channel_lessthan_topup_amount']) {
            const amount = validity['channel_lessthan_topup_amount'][1] - validity['channel_lessthan_topup_amount'][0];

            jobPromise.emit(RUN_JOB_STATE.request_channel_add_funds, {channel:channel.data, amount: amount});

            receipt = await channel.channelAddFunds(amount);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_add_funds, this._mapReceiptForEvent(receipt));
        }
        else if(validity['channel_lessthan_topup_expiration']) {
            jobPromise.emit(RUN_JOB_STATE.request_channel_extend_expiration,
                {channel:channel.data, expiration:validity['channel_lessthan_topup_expiration'][1]});

            receipt = await channel.channelExtend(validity['channel_lessthan_topup_expiration'][1]);

            jobPromise.emit(RUN_JOB_STATE.reply_channel_extend_expiration, this._mapReceiptForEvent(receipt));
        }
    }

    _mapReceiptForEvent(txResult:{method:string, tx:Object, receipt: Object}): Object {
        const receipt = Object.assign({}, txResult.receipt);
        delete receipt['logs'];
        delete receipt['logsBloom'];

        return {method: txResult.method, transaction: txResult.tx ? txResult.tx['transaction'] : null, receipt: receipt};
    }

    _findLargestChannel(channels:Channel[]): Channel {
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