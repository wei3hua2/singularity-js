import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Eth} from '../../src/eth';
import {Marketplace} from '../../src/marketplace';
import {Channels} from '../../src/channels';

let web3, eth, marketplace, PERSONAL_ACCOUNT;

m.before(() => {
    web3 = initWeb3();
    eth = new Eth(web3);
    marketplace = new Marketplace(eth);
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
});
m.after(() => {
    eth.close();
})

m.describe.skip('Channels', () => {
  m.it('should channels', async function() {
    const channels = new Channels(marketplace);
    const availableChannels = await channels.getAvailableChannels(PERSONAL_ACCOUNT,'snet','example-service');

    console.log(availableChannels);
  });
})
