const fs = require('fs');
const Web3 = require('web3');
const {AccountSvc} =  require('../../dist/impls');
const NETWORKS = require('./NETWORKS.json');
const CONFIG = require('./CONFIG.json');

function initWeb3 () {
    const web3Provider = NETWORKS[CONFIG['CHAINID']]['ws_provider'];
    
    return new Web3(new Web3.providers.WebsocketProvider(web3Provider));
}

//singleton
class Config {
    constructor() {
        this.web3 = initWeb3();
        
        this.PERSONAL_ACCOUNT = CONFIG['PERSONAL_ACCOUNT'];
        this.PERSONAL_ACCOUNT_PK = CONFIG['PERSONAL_PRIVATE_KEY'];
        this.TEST_ACCOUNT = CONFIG['TEST_ACCOUNT'];
        this.TEST_ACCOUNT_PK = CONFIG['TEST_ACCOUNT_PRIVATE_KEY'];
        this.CHAINID = CONFIG['CHAINID'];

        if(process.env.SINGNET_DISABLE_TEST_CONSOLE) this.DISABLE_CONSOLE = true;
        else this.DISABLE_CONSOLE = CONFIG['DISABLE_CONSOLE'];

        this._init = false;
        this.initcount = 0;
    }

    log(s) {
        if(!this.DISABLE_CONSOLE) console.log(s);
    }

    async init() {
        if(!this._init) {
            this.acct1 = await AccountSvc.create(this.web3, 
                {address:this.PERSONAL_ACCOUNT, privateKey:this.PERSONAL_ACCOUNT_PK});
            this.acct2 = await AccountSvc.create(this.web3, 
                {address:this.TEST_ACCOUNT, privateKey:this.TEST_ACCOUNT_PK});

            this._init = true;
        }
        ++this.initcount;
    }

    teardown() {
        --this.initcount;
        
        if(this.initcount === 0)
            this.web3.currentProvider.connection.close();
    }

    static async init() {
        if(!Config.config) Config.config = new Config();
        await Config.config.init();
        return Config.config;
    }
}


module.exports = {Config}