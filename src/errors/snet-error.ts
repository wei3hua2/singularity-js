class SnetError extends Error {
    name: string;
    code: string;
    params: any[];

    constructor(error_code:string, ...params) {
        const errMsg = handleErrorCodeMessage(error_code, params);
        super(errMsg);

        this.code = error_code;
        this.params = params;
        this.name = "SnetError";

        Object.setPrototypeOf(this, SnetError.prototype);
    }
}

enum SNET_ERROR_CODE {
    snet_init_params_not_found = 'snet_init_params_not_found',
    snet_invalid_web3 = 'snet_invalid_web3'
}
enum RUNJOB_ERROR_CODE {
    runjob_svc_call_error = 'runjob_svc_call_error',
    runjob_no_channel_found = 'runjob_no_channel_found',
    runjob_insufficient_fund_expiration = 'runjob_insufficient_fund_expiration',
    runjob_invalid_channel_expiry_options = 'runjob_invalid_channel_expiry_options',
    runjob_invalid_channel_amount_options = 'runjob_invalid_channel_amount_options',
    runjob_invalid_escrow_amount_options = 'runjob_invalid_escrow_amount_options',
    runjob_insufficient_fund_escrow = 'runjob_insufficient_fund_escrow',
    runjob_condition_not_meet = 'runjob_condition_not_meet'
}
enum ETH_ERROR_CODE {
    eth_tx_error = "eth_tx_error",
    eth_networkid_error = "eth_networkid_error",
    eth_account_error = "eth_account_error"
}
enum CONTRACT_ERROR_CODE {
    contract_init_error = "contract_init_error"
}
enum CHANNEL_ERROR_CODE {
    channel_endpoint_not_found = 'channel_endpoint_not_found'
}
enum ORG_ERROR_CODE {
    org_id_not_found = "org_id_not_found",
    org_id_svc_not_found = "org_id_svc_not_found"
}
enum SVC_ERROR_CODE {
    svc_registry_id_not_found = "svc_registry_id_not_found",
    svc_metadata_not_init = 'svc_metadata_not_init',
    svc_protobuf_not_init = 'svc_protobuf_not_init',
    svc_not_init = 'svc_not_init'
}

const ERROR_CODES = {
    ...SNET_ERROR_CODE, ...RUNJOB_ERROR_CODE, ...ETH_ERROR_CODE,
    ...CHANNEL_ERROR_CODE, ...ORG_ERROR_CODE, ...SVC_ERROR_CODE,
    ...CONTRACT_ERROR_CODE
 };

function handleErrorCodeMessage(errorCode: string, params: any[]): string {
    switch (errorCode) {
        // snet
        case ERROR_CODES.snet_init_params_not_found:
            if(!params[0]) return 'Snet.init web3 not found';
            const addressNotFound = !params[1].address ? 'address' : '';
            const pkNotFound = !params[1].privateKey ? 'privateKey' : '';
            const ethereumNotFound = !params[1].ethereum ? 'ethereum' : '';

            return `Snet.init fields not found : ${addressNotFound} ${pkNotFound} ${ethereumNotFound}`;
        case ERROR_CODES.snet_invalid_web3: return `Snet.init : ${params[0]}`;

        // contract
        case ERROR_CODES.contract_init_error: return `fail to initialize contract`;

        // service
        case ERROR_CODES.svc_registry_id_not_found: return `service Id ${params[0]} : ${params[1]} not found`;
        case ERROR_CODES.svc_metadata_not_init: return `metadata not initialized`;
        case ERROR_CODES.svc_protobuf_not_init: return `protocol buffer not initialized`;
        case ERROR_CODES.svc_not_init: return `service not initialized`;

        // organization
        case ERROR_CODES.org_id_not_found: return 'OrganizationSvc Id not found';
        case ERROR_CODES.org_id_svc_not_found: return `ServiceSvc org Id ${params[0]} not found`;

        // eth
        case ERROR_CODES.eth_tx_error: return `web3 transaction issue : ${params[0]}`;
        case ERROR_CODES.eth_networkid_error: return `Invalid network id ${params[0]}`;
        case ERROR_CODES.eth_account_error: return `Fail to get account : ${params[0]}`;

        // channel
        case ERROR_CODES.channel_endpoint_not_found: return `Channel ${params[0].id} endpoint not found`;

        //Run job
        case ERROR_CODES.runjob_svc_call_error: 
            return `Error while calling service method ${params[0]} ${JSON.stringify(params[1])} : ${params[2]}`;
        case ERROR_CODES.runjob_no_channel_found:
            return `No channel found : ${params[0]}`;
        case ERROR_CODES.runjob_insufficient_fund_expiration: 
            return `Insufficient fund or expired : ${JSON.stringify(params[0])}`;
        case ERROR_CODES.runjob_invalid_channel_expiry_options: 
            return `Channel expiration option error : ${params[0]}`;
        case ERROR_CODES.runjob_invalid_channel_amount_options:
            return `Channel amount option error : ${params[0]}`;
        case ERROR_CODES.runjob_invalid_escrow_amount_options:
            return `Escrow amount option error : ${params[0]}`;
        case ERROR_CODES.runjob_insufficient_fund_escrow:
            return `${params[0]}`;
        case ERROR_CODES.runjob_condition_not_meet:
            return `Condition : ${JSON.stringify(params[0])} not meet for id :
                ${params[1] ? params[1].id : 'none'} expiration : ${params[1] ? params[1].expiration : 'none'} value : ${params[1] ? params[1].value : 'none'}`;



        default:
            return 'unknown error found';
    }
}

export {SnetError, ERROR_CODES}