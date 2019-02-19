import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Snet} from '../../src/snet';
import { RUN_JOB_STATE } from '../../src/service';
import {PromiEvent} from 'web3-core-promievent';

let web3, eth, marketplace, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe('Snet', () => {
  m.xit('should get list organizations', async function () {
    const snet = Snet.init(web3);
    const orgs = await snet.listOrganizations();
  });

  m.xit('should get organization snet', async function (done) {
    const snet = Snet.init(web3);
    
    // const org = await snet.getOrganization('snet');
    // console.log(org.toString());
    // const svcs = await org.getServices();
    // console.log(svcs);

    // const orgs = await snet.listOrganizations();
    // console.log(orgs);
    
  });

  m.it('should run job snet.example_service', async function () {
    const snet = Snet.init(web3);

    const svc = await snet.getService('snet','example-service');
    const result = await svc.fetch();

    c.expect(result).to.be.true;

    const promi:PromiEvent = svc.runJob('add',{a:3, b:5},
      {from:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    
    // for (let item in RUN_JOB_STATE) {
    //     promi.on(item, (...params) => {
    //       console.log('========'+item+'==========');
    //       console.log(params);
    //     })
    // }

    const response = await promi

    c.expect(response.value).to.be.equals(8);
    
  }).timeout(20000);


  m.xit('should snet', async function() {
    const snet = Snet.init(web3);

    const result = await snet.runJob('snet','example-service', 
      'add', {a:3, b:5}, 
      {from:PERSONAL_ACCOUNT, amountInCogs:1, ocExpiration:10000, privateKey:PERSONAL_PRIVATE_KEY});

    c.expect(result.value).to.be.equals(8);
  });
})
