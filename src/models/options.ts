interface InitOptions {
    init?: boolean;
}

// enum RUN_JOB_STATE {
//     available_channels = 'available_channels',
//     selected_channel = 'selected_channel',
//     service_created = 'service_created',
//     before_execution = 'before_execution',
//     host = 'host',
//     get_channel_state = 'get_channel_state',
//     sign_channel_opts = 'sign_channel_opts',
//     sign_request = 'sign_request',
//     signed_channel = 'signed_channel',
//     channel_state = 'channel_state',
//     price_in_cogs = 'price_in_cogs',
//     signed_header = 'signed_header',
//     request_header = 'request_header',
//     request_info = 'request_info',
//     raw_response = 'raw_response'
// }

enum RUN_JOB_STATE {
    available_channels = 'available_channels',
    create_new_channel = 'create_new_channel',
    channel_extend_and_add_funds = 'channel_extend_and_add_funds',
    channel_add_funds = 'channel_add_funds',
    channel_extend_expiration = 'channel_extend_expiration',
    selected_channel = 'selected_channel',
    sign_channel_state = 'sign_channel_state',
    channel_state = 'channel_state',
    sign_request_header = 'sign_request_header',
    request_info = 'request_info',
    response = 'response'
}

/********
 * default: use_channel_id = null, autohandle_channel = true, 
 *          channel_min_amount = 1, channel_min_expiration = current + x
 * 
 * if use_channel_id is number:
 *   retrieve channel is channel_id
 *   if channel not found, throw Error:notfound
 *   else if min_amount && min_expiration not met, topup if autohandle_channel
 * 
 * else retrieve all channels, select 1st channel that meet min_amount && min_expiration:
 *   if not found:
 *     if autohandle_channel is false, throw Error:notfound
 *     else topup if there's channel, else create channel
 * 
 * 
*************/
interface RunJobOptions {
    use_channel_id?: number;
    autohandle_channel?: boolean;
    channel_min_amount?: number;
    channel_min_expiration?: number;
}

export {InitOptions, RUN_JOB_STATE, RunJobOptions}