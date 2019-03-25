interface InitOptions {
    init?: boolean;
}

enum RUN_JOB_STATE {
    request_available_channels = 'request_available_channels',
    reply_available_channels = 'reply_available_channels',

    request_new_channel = 'request_new_channel',
    reply_new_channel = 'reply_new_channel',

    resolved_channel = 'resolved_channel',

    request_channel_state = 'request_channel_state',
    reply_channel_state = 'reply_channel_state',

    checked_channel_validity = 'checked_channel_validity',

    request_channel_extend_and_add_funds = 'request_channel_extend_and_add_funds',
    reply_channel_extend_and_add_funds = 'reply_channel_extend_and_add_funds',
    
    request_channel_add_funds = 'request_channel_add_funds',
    reply_channel_add_funds = 'reply_channel_add_funds',
    
    request_channel_extend_expiration = 'request_channel_extend_expiration',
    reply_channel_extend_expiration = 'reply_channel_extend_expiration',
    
    request_svc_call = 'request_svc_call',
    reply_svc_call = 'reply_svc_call',

    debug_update_options = 'debug_update_options',

    stats = 'stats'
}

interface RunJobOptions {
    autohandle_channel?: boolean;        // default true
    channel_min_amount?: number;         // default signedAmount + fixed_price * 1 (assume only called once)
    channel_min_expiration?: number;     // default currentBlockNo + threshold + 3 min
    channel_topup_amount?: number;       // default channel_min_amount (assume only called once)
    channel_topup_expiration?: number;   // default currentBlockNo + threshold + 60 min
}

export {InitOptions, RUN_JOB_STATE, RunJobOptions}