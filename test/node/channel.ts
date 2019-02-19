import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Channel} from '../../src/channel';
import {Service} from '../../src/service';
import { Account } from '../../src/account';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK;

m.before(() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    account = new Account(web3,{address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe.only('Channels', () => {
    m.it('should get channel information', async function () {
        const channel = Channel.init(account, 1109);
        await channel.fetch();

        c.expect(channel.signer).to.be.equals(PERSONAL_ACCOUNT);
    });

    m.it('should get available channels for account', async function () {
        const aChannel = await Channel.getAvailableChannels(account, PERSONAL_ACCOUNT, 'snet', 'example-service');

        aChannel.map((c)=>console.log(c.toString()));
    });

    m.it('should open channel', async function () {
        const exampleSvc = await Service.init(account, 'snet','example-service');
        await exampleSvc.fetch();
        console.log(exampleSvc.toString());
        
        const receipt = await exampleSvc.openChannel(1, {from:PERSONAL_ACCOUNT, privateKey:PERSONAL_ACCOUNT_PK});

        console.log(receipt);
    });
})
