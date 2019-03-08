/**
 * @module snet
 */

class SnetError extends Error {
    name: string;
    code: string;
    params: any[];
    constructor(error_code:string, ...params) {
        const err = ERROR_CODES[error_code] || {message:'unknown error found'};
        const msg = typeof err.message === 'function' ? err.message(params) : err.message;
        super(msg);

        this.code = error_code;
        this.params = params;
        this.name = "SnetError";

        Object.setPrototypeOf(this, SnetError.prototype); // restore prototype chain
    }
}


enum ERROR_CODE {
    /** 
    * when org id is not found
    */
    org_id_not_found = "org_id_not_found",
    org_id_svc_not_found = "org_id_svc_not_found",
    sv_registry_id_not_found = "sv_registry_id_not_found",
    runjob_condition_not_meet = "runjob_condition_not_meet",
    channel_endpoint_not_found = 'channel_endpoint_not_found',
    grpc_call_error = 'grpc_call_error'
}

/**
 * @ignore
 */
const ERROR_CODES = {
    "org_id_not_found":{
        message:'OrganizationSvc Id not found'
    },
    "org_id_svc_not_found":{
        message: (params:any[]) => `ServiceSvc org Id ${params[0]} not found`
    },
    "sv_registry_id_not_found":{
        message: (params:any[]) => `service Id ${params[0]} : ${params[1]} not found`
    },
    "runjob_condition_not_meet": {
        message: (params:any[]) => `Condition : ${JSON.stringify(params[0])} not meet for id :
            ${params[1] ? params[1].id : 'none'} expiration : ${params[1] ? params[1].expiration : 'none'} value : ${params[1] ? params[1].value : 'none'}`
    },
    "channel_endpoint_not_found": {
        message: (params:any[]) => `Channel ${params[0].id} endpoint not found`
    },
    "grpc_call_error": {
        message: (params:any[]) => `Error while calling service method
        ${params[0]} ${JSON.stringify(params[1])} : ${params[2]}`
    }
};

export {SnetError, ERROR_CODE}