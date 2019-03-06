import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {ServiceSvc} from '../../src/impls/service';
import {AccountSvc} from '../../src/impls/account';
import {getConfigInfo} from './utils';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(async() => {
    web3 = initWeb3();

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];

    account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
});
m.after(async () => {
  web3.currentProvider.connection.close();
});

m.describe('ServiceSvc', () => {

  m.it('should get service channels for example-service snet', async () => {
    const svc = await ServiceSvc.init(account, 'snet', 'example-service');
    const channels = await svc.getChannels();
    c.expect(channels.length).to.be.greaterThan(0);
  });

  m.it('should list available methods', async function() {
    const svc = await ServiceSvc.init(account, 'snet', 'example-service');
    const methods = await svc.listMethods();

    c.expect(methods).to.have.all.keys(['add','sub','mul','div']);
  });
})
