const c = require('chai');
const m = require('mocha');
const {initWeb3, getConfigInfo} = require('./utils');
const {Snet} = require('../../dist/snet');

let web3, account, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

let log = function(s){
  console.log(s);
}

m.before(async() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];

    if(!getConfigInfo()['ENABLE_CONSOLE']) log = function(s){}

    // account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
});
m.after(async () => {
  web3.currentProvider.connection.close();
});

m.describe.skip('Utility', () => {
    m.xit('should list organization', async function (done) {
        const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

        const header = snet.utils.listenNewBlockHeaders();
        header.on('data', blockHeader => {
            console.log(blockHeader);

            snet.utils.getBlockNumber().then(console.log);
            console.log();
        });
        header.on('error', console.error);

    }).timeout(100000000000);
});