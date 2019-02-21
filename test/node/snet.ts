import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Snet} from '../../src/snet';

let web3, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe('Snet', () => {
  m.it('should initialize with appropriate objects without error', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

    c.expect(snet.getCurrentAccount()).to.exist;
  });
})
