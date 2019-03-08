import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {ChannelSvc} from '../../src/impls/channel';
import {ServiceSvc} from '../../src/impls/service';
import { AccountSvc } from '../../src/impls/account';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK;

m.before(async () => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    // PERSONAL_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    // PERSONAL_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
    account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_ACCOUNT_PK});
    await account.init();
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe('Channels', () => {
    m.xit('should open channel on snet, example-service', async function () {
        const exampleSvc = await ServiceSvc.init(account, 'snet','example-service');
        await exampleSvc.init();
        
        // const channels:ChannelSvc[] = await exampleSvc.getChannels();
        // channels.forEach((c) => {
        //     console.log(c.toString());
        // });

        // const channel = channels.find((c)=> c.id === 1133);
        // await channel.claimTimeout();

        const c = ChannelSvc.init(account, 1133);
        await c.init();
        console.log(c.toString());


        // const receipt = await exampleSvc.openChannel(20, {from:PERSONAL_ACCOUNT, privateKey:PERSONAL_ACCOUNT_PK});
        // console.log(receipt);
        
    }).timeout(10 * 60 * 1000);
})
