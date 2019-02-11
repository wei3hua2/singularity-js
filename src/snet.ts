import {Eth} from './eth';
import {Registry} from './registry';
import {Mpe} from './mpe';
import {Tokens} from './tokens';
import {Accounts} from './accounts';
import {Channels} from './channels';
import {Client} from './client';
import {Identity} from './identity';
import {Marketplace} from './marketplace';
import {Organizations} from './organizations';
import {Services} from './services';

import * as utils from './utils';

class Snet {
    eth: Eth;
    registry: Registry;
    mpe: Mpe;
    tokens: Tokens;
    accounts: Accounts;
    channels: Channels;
    client: Client;
    identity: Identity;
    markeplace: Marketplace;
    organizations :Organizations;
    services: Services;

    utils: any = utils;

    private web3: any;

    constructor(web3) {
        this.web3 = web3;
        console.log('hello world from constructor : ' + this.web3);
    }
}

function create (web3) {
    return new Snet(web3);
}

export {
    Eth, Registry, Mpe, Tokens, Accounts, Organizations,
    Channels, Client, Identity, Marketplace, Services,
    create, utils
};