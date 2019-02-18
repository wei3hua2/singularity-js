import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {SnetError} from './errors/snet-error';
import {CoreModel} from './core-model';

class Repository extends CoreModel{
    
    constructor(registry:Registry, mpe:Mpe, fields:any){
        super(registry, mpe, fields);
    }

    async fetch(){
        return false;
    }
}

export {Repository}