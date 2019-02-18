import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {SnetError} from './errors/snet-error';

abstract class CoreModel {
    public id: string;

    protected _registry:Registry;
    protected _mpe:Mpe;

    protected _fetched: boolean = false;

    constructor(registry:Registry, mpe:Mpe, fields:any) {
        this._registry = registry;
        this._mpe = mpe;

        if(!fields.id) throw new SnetError('id_not_found');
        
        this.id = fields.id;
    }

    abstract async fetch(): Promise<boolean>;

    public toString() : string {
        return 'core-model id : '+this.id;
    }
}

export {CoreModel}