/**
 * @ignore
 */

import {Model} from './model';

class Repository extends Model{
    
    constructor(web3:any, fields:any){
        super(web3, fields);
    }

    async fetch(){
        return false;
    }
}

export {Repository}