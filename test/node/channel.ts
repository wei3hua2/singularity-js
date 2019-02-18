import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Eth} from '../../src/eth';
import {Mpe} from '../../src/contracts/mpe';
import {Channel} from '../../src/channel';
import {ChannelState} from '../../src/channel-state';
import { Marketplace } from '../../src/snet';

let web3, eth, mpe, marketplace, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK;

m.before(() => {
    web3 = initWeb3();
    eth = new Eth(web3);
    mpe = new Mpe(eth);
    marketplace = new Marketplace(eth);
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    eth.close();
})

m.describe('Channels', () => {
    m.it('should get channel information', async function () {
        const channel = new Channel(mpe, 1109);
        await channel.fetch();

        c.expect(channel.signer).to.be.equals(PERSONAL_ACCOUNT);

        const channelState = channel.initChannelState(); //This should fail now
        const cs = await channelState.getChannelState({privateKey:PERSONAL_ACCOUNT_PK});

        c.expect(cs).to.have.all.keys(['currentSignedAmount','currentNonce','currentSignature']);
    });

    m.it('should get available channels for account', async function () {
        const aChannel = await Channel.getAvailableChannels(
                    marketplace, mpe,
                    PERSONAL_ACCOUNT, 'snet', 'example-service');

        aChannel.map((c)=>console.log(c.toString()));
        
    });
})
