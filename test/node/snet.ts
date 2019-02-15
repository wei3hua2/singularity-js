import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Snet} from '../../src/snet';

let web3, eth, marketplace, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe.only('Snet', () => {
  m.xit('should get available channels', async function () {
    const snet = Snet.create(web3);
    const availableChannels = await snet.getAvailableChannels(PERSONAL_ACCOUNT, 'snet','example-service');

    c.expect(availableChannels.status).to.be.equals('success');
  });

  m.xit('should get service info', async function () {
    const snet = Snet.create(web3);
    const svc = await snet.getService('snet','example-service');

    console.log(svc);
    c.expect(svc.status).to.be.equals('success');
  });

  m.it('should snet', async function() {
    const snet = Snet.create(web3);

    const result = await snet.runService('snet','example-service', 
      'add', {a:3, b:5}, 
      {from:PERSONAL_ACCOUNT, amountInCogs:1, ocExpiration:10000, privateKey:PERSONAL_PRIVATE_KEY});

    console.log('RESULT ====');
    console.log(result);
  });

  m.xit('should add fund to channel', async function () {
    const snet = Snet.create(web3);
    const response = await snet.contracts.mpe.channelAddFunds(1109,10,{
      signTx:true, from:PERSONAL_ACCOUNT, fromPrivateKey:PERSONAL_PRIVATE_KEY
    });

    console.log(response);
  });
})
