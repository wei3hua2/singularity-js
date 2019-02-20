import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Channel} from '../../src/channel';
import {Service} from '../../src/service';
import { Account } from '../../src/account';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK;

m.before(async () => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    account = new Account(web3,{address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
    await account.init();
});
m.after(() => {
    // web3.currentProvider.connection.close();
})

m.describe.only('Channels', () => {
    m.xit('should get channel information', async function () {
        const channel = Channel.init(account, 1109);
        await channel.fetch();

        c.expect(channel.signer).to.be.equals(PERSONAL_ACCOUNT);
    });

    m.xit('should get available channels for account', async function () {
        const aChannel = await Channel.getAvailableChannels(account, PERSONAL_ACCOUNT, 'snet', 'example-service');
        console.log(aChannel);
    });
    m.it('should listen to open channel', async function (done) {
        const blockNo = await account._eth.getBlockNumber();
        const emitter = Channel.listenOpenChannel(account, 
            {filter:{sender:PERSONAL_ACCOUNT}, fromBlock:blockNo-10000});
        console.log('listening to open channel...');
        let data = 0;
        let changed = 0;

        emitter.on('data',(evt)=> {
            data++;
            console.log('====== data '+data+'=====');
            // console.log(evt);
            
        }).on('changed',(evt) => {
            changed++;
            console.log('====== changed '+changed+'=====');
            // console.log(evt);
        }).on('error', console.error);

    }).timeout(500000);

    m.xit('should listen to open channel once', async function () {
        const once = Channel.listenOpenChannelOnce(account);
        console.log(once);
        console.log(await once);
    }).timeout(500000);

    m.xit('get past events', async function () {
        const blockNo = await account._eth.getBlockNumber();
        const past = await Channel.PastOpenChannel(account,
            {filter:{sender:PERSONAL_ACCOUNT}, fromBlock:blockNo-10000, toBlock:'latest'});

        console.log('past length = '+past.length);
        c.expect(past.length).to.be.greaterThan(0);
        
    }).timeout(500000);

    m.xit('should open channel', async function () {
        const exampleSvc = await Service.init(account, 'snet','example-service');
        await exampleSvc.fetch();
        console.log(exampleSvc.toString());

        try {
            const receipt = await exampleSvc.openChannel(1, {from:PERSONAL_ACCOUNT, privateKey:PERSONAL_ACCOUNT_PK});
            console.log(receipt);
        }catch(err){
            console.log('Och.......');
            console.error(err);
        }
    }).timeout(50000);
})
