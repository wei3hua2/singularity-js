interface InitOptions {
    init?: boolean;
}

// enum RUN_JOB_STATE {
//     available_channels = 'available_channels',
//     create_new_channel = 'create_new_channel',
//     selected_channel = 'selected_channel',
//     sign_channel_state = 'sign_channel_state',
//     channel_state = 'channel_state',
//     channel_validity = 'channel_validity',
//     escrow_deposit = 'escrow_deposit',
//     channel_extend_and_add_funds = 'channel_extend_and_add_funds',
//     channel_add_funds = 'channel_add_funds',
//     channel_extend_expiration = 'channel_extend_expiration',
//     sign_request_header = 'sign_request_header',
//     request_info = 'request_info',
//     response = 'response'
// }

enum RUN_JOB_STATE {
    request_available_channels = 'request_available_channels',
    reply_available_channels = 'reply_available_channels',
    request_new_channel = 'request_new_channel',
    reply_new_channel = 'reply_new_channel',
    resolved_channel = 'resolved_channel',
    request_channel_state = 'request_channel_state',
    reply_channel_state = 'reply_channel_state',
    checked_channel_validity = 'checked_channel_validity',
    request_escrow_approve_allowance = 'request_escrow_approve_allowance',
    reply_escrow_approve_allowance = 'reply_escrow_approve_allowance',
    request_escrow_deposit = 'request_escrow_deposit',
    reply_escrow_deposit = 'reply_escrow_deposit',
    request_channel_extend_and_add_funds = 'request_channel_extend_and_add_funds',
    reply_channel_extend_and_add_funds = 'reply_channel_extend_and_add_funds',
    request_channel_add_funds = 'request_channel_add_funds',
    reply_channel_add_funds = 'reply_channel_add_funds',
    request_channel_extend_expiration = 'request_channel_extend_expiration',
    reply_channel_extend_expiration = 'reply_channel_extend_expiration',
    request_svc_call = 'request_svc_call',
    reply_svc_call = 'reply_svc_call'
}

interface RunJobOptions {
    autohandle_channel?: boolean;        // default true
    autohandle_escrow?: boolean;         // default true
    channel_min_amount?: number;         // default signedAmount + fixed_price * 1 (assume only called once)
    channel_min_expiration?: number;     // default currentBlockNo + threshold + 3 min
    channel_topup_amount?: number;       // default channel_min_amount (assume only called once)
    channel_topup_expiration?: number;   // default currentBlockNo + threshold + 60 min
    escrow_topup_amount?: number;        // default channel_min_amount (assume only called once)
    escrow_min_amount?: number;          // default channel_min_amount (assume only called once)
}

export {InitOptions, RUN_JOB_STATE, RunJobOptions}