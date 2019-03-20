const c = require('chai');
const m = require('mocha');
const u = require('./utils');
const Snet =  require('../../dist/snet').Snet;
const ServiceSvc =  require('../../dist/impls').ServiceSvc;
const OrganizationSvc =  require('../../dist/impls').OrganizationSvc;
const AccountSvc =  require('../../dist/impls').AccountSvc;
const Service =  require('../../dist/models').Service;
const Organization =  require('../../dist/models').Organization;
const Account =  require('../../dist/models').Account;
const Utils =  require('../../dist/utils').Utils;


let web3, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(() => {
    web3 = u.initWeb3();
    PERSONAL_ACCOUNT = u.getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = u.getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    web3.currentProvider.connection.close();
})

m.describe('Snet', () => {

  m.it('should have valid class', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    
    const orgs = await snet.listOrganizations();
    const org = await snet.getOrganization('snet', {init: false});
    const svc = await snet.getService('snet', 'example-service', {init: false});

    c.expect(snet).to.be.an.instanceof(Snet);
    c.expect(snet.utils).to.be.an.instanceof(Utils);
    c.expect(snet.account).to.be.an.instanceof(Account);
    c.expect(snet.account).to.be.an.instanceof(AccountSvc);
    c.expect(svc).to.be.an.instanceof(Service);
    c.expect(svc).to.be.an.instanceof(ServiceSvc);
    c.expect(orgs).to.be.an.instanceof(Array);
    c.expect(orgs[0]).to.be.an.instanceof(Organization);
    c.expect(orgs[0]).to.be.an.instanceof(OrganizationSvc);
    c.expect(org).to.be.an.instanceof(Organization);
    c.expect(org).to.be.an.instanceof(OrganizationSvc);

    c.expect(org).to.not.be.an.instanceof(Snet);
  });

  m.it('should list organization', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    // organizations

    let orgs = await snet.listOrganizations();
    let org = orgs[0];

    c.expect(orgs.length).to.be.greaterThan(0);
    c.expect(org.isInit).to.be.false;
    c.expect(org.id).to.exist;
    c.expect(org.name).to.undefined;


    orgs = await snet.listOrganizations({init:true});
    org = orgs[0];

    c.expect(orgs.length).to.be.greaterThan(0);
    c.expect(org.isInit).to.be.true;
    c.expect(org.id).to.exist;
    c.expect(org.name).to.exist;
    c.expect(org.services.length).to.be.greaterThan(0);

  });

})
