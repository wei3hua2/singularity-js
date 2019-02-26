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
    // PERSONAL_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    // PERSONAL_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
    account = await Account.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_ACCOUNT_PK});
    await account.init();
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe('Channels', () => {
    m.xit('should get available channels for account', async function () {
        const aChannel:Channel[] = await Channel.getAvailableChannels(account, PERSONAL_ACCOUNT, 'snet', 'example-service');
        const channels = Array.from(aChannel);  // channels.forEach((c)=>console.log(c.toString()));
        const lastChannel = channels[channels.length - 1];   // console.log(lastChannel.toString());

        for(var i=0;i<channels.length;i++) {
            const channel = channels[i];
            // if(channel.id <1221) continue;
            // if(channel.id === 1228) await channel.extendAndAddFunds(2);

            console.log(channel.toString());
            const reply = await channel.getChannelState();
            console.log(reply);
            console.log();
        }
        console.log('Channel Length : '+channels.length);
        
    }).timeout(10 * 60 * 1000);

    m.xit('should listen to open channel', async function (done) {
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

    m.xit('get past events', async function () {
        const blockNo = await account._eth.getBlockNumber();
        const past = await Channel.PastOpenChannel(account,
            {filter:{sender:PERSONAL_ACCOUNT}, fromBlock:blockNo-10000, toBlock:'latest'});

        console.log('past length = '+past.length);
        c.expect(past.length).to.be.greaterThan(0);
        
    }).timeout(500000);

    m.xit('should open channel on snet, example-service', async function () {
        const exampleSvc = await Service.init(account, 'snet','example-service');
        await exampleSvc.fetch();
        
        // const channels:Channel[] = await exampleSvc.getChannels();
        // channels.forEach((c) => {
        //     console.log(c.toString());
        // });

        // const channel = channels.find((c)=> c.id === 1133);
        // await channel.claimTimeout();

        const c = Channel.init(account, 1133);
        await c.fetch();
        console.log(c.toString());


        // const receipt = await exampleSvc.openChannel(20, {from:PERSONAL_ACCOUNT, privateKey:PERSONAL_ACCOUNT_PK});
        // console.log(receipt);
        
    }).timeout(10 * 60 * 1000);
})
