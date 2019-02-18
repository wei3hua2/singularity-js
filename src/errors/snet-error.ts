class SnetError extends Error {
    constructor(error_code:string, ...params) {
        const err = ERROR_CODES[error_code] || {message:'unknown error found'};
        const msg = typeof err.message === 'function' ? err.message(params) : err.message;
        super(msg);

        Object.setPrototypeOf(this, SnetError.prototype); // restore prototype chain
    }
}


const ERROR_CODES = {
    "org_id_not_found":{
        message:'Organization Id not found'
    },
    "org_id_svc_not_found":{
        message: (params:any[]) => `Service org Id ${params[0]} not found`
    }
};

export {SnetError, ERROR_CODES}