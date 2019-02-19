/**
 * @ignore
 */

import {Core} from './core';
import {SnetError} from './errors/snet-error';

abstract class Model extends Core {
    public id: string;
    protected _fetched: boolean = false;

    constructor(web3:any, fields:any) {
        super(web3);

        if(!fields.id) throw new SnetError('id_not_found');
        this.id = fields.id;
    }

    abstract async fetch(): Promise<boolean>;

    public toString() : string {
        return 'model id : '+this.id;
    }
}

export {Model}