/**
 * @ignore
 */

import {Model} from './model';
import {Account} from './account';

class Repository extends Model{
    
    constructor(account:Account){
        super(account);
    }

    async fetch(){
        return false;
    }
}

export {Repository}