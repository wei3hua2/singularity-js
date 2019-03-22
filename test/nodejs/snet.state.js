const c = require('chai');
const m = require('mocha');
const Snet =  require('../../dist/snet').Snet;
const ServiceSvc =  require('../../dist/impls').ServiceSvc;
const OrganizationSvc =  require('../../dist/impls').OrganizationSvc;
const AccountSvc =  require('../../dist/impls').AccountSvc;
const Service =  require('../../dist/models').Service;
const Organization =  require('../../dist/models').Organization;
const Account =  require('../../dist/models').Account;
const Utils =  require('../../dist/utils').Utils;

const {Config} = require('../config/config');

let config;

m.before(async () => {
  config = await Config.init();
});
m.after(() => {
  config.teardown();
})

m.describe('snet-state', () => {
  m.it('should run example-service add job 5 + 8 = 13', async function () {
    const snet = await Snet.init(config.web3, {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});

    const reply = await snet.runJob('snet', 'example-service', 'add', {a:5, b:8});
    
    c.expect(reply.value).to.be.equal(13);
  });
})
