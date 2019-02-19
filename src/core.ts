/**
 * @ignore
 */

import {Registry} from './contracts/registry';
import {Mpe} from './contracts/mpe';
import {Tokens} from './contracts/tokens';
import {Eth} from './eth';
import { Marketplace } from './marketplace';

abstract class Core {
    protected _registry:Registry;
    protected _mpe:Mpe;
    protected _tokens:Tokens;
    protected _eth:Eth;
    protected _marketplace:Marketplace;
    protected web3:any;

    constructor(web3:any) {
        this.web3 = web3;
        this._eth = new Eth(web3);
        
        this._tokens = new Tokens(this._eth);
        this._mpe = new Mpe(this._eth);
        this._registry = new Registry(this._eth)
        
        this._marketplace = new Marketplace(this._eth);
    }
}

export {Core}