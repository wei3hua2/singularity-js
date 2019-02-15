import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {Eth} from '../../src/eth';

let web3, eth;

m.before(() => {
    web3 = initWeb3();
    eth = new Eth(web3);
});
m.after(() => {
    eth.close();
})

m.describe.skip('Eth', () => {
  m.it('should ensure basic information is valid', async function() {
    const version = eth.getWeb3Version();
    const netId = await eth.getNetworkId();
    const accounts = await eth.getAccounts();

    c.expect(version).to.equal('1.0.0-beta.37');
    c.expect(netId).to.equal(42);
    c.expect(typeof accounts).to.equal('object');
  });
})
