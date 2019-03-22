const c = require('chai');
const m = require('mocha');
const {Snet} =  require('../../dist/snet');
const {ServiceSvc, OrganizationSvc, AccountSvc} = require('../../dist/impls')
const {Service, Organization, Account} =  require('../../dist/models');
const {ERROR_CODES}  = require('../../dist/errors');
const {Utils} =  require('../../dist/utils');
const {Config} = require('../config/config');

let config;

m.before(async () => {
  config = await Config.init();
});
m.after(() => {
  config.teardown();
})

m.describe('snet-call', () => {

  m.it('should have valid class', async function () {
    const snet = await Snet.init(config.web3, 
      {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});
    
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

  m.it('should result in errors', async function () {
    // web3 not found
    try {
      await Snet.init();
    }catch(err) {
      c.expect(err.name).to.be.equal('SnetError');
      c.expect(err.code).to.be.equal(ERROR_CODES.snet_invalid_web3);
    }

    // invalid options
    try {
      await Snet.init(config.web3, {});
    }catch(err){
      c.expect(err.name).to.be.equal('SnetError');
      c.expect(err.code).to.be.equal(ERROR_CODES.snet_init_params_not_found);
    }

    // invalid web3
    try {
      await Snet.init('invalid', {address:'address',privateKey:'privatekey'});
    }catch(err) {
      c.expect(err.name).to.be.equal('SnetError');
      c.expect(err.code).to.be.equal(ERROR_CODES.snet_invalid_web3);
    }
  });

  m.it('should list and get organizations', async function () {
    const snet = await Snet.init(config.web3, {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});
    // organizations

    const orgs = await snet.listOrganizations();
    const orgsData = orgs.map(o => o.data);

    c.expect(orgs.length).to.be.greaterThan(0);
    
    orgs.forEach(org => {
      c.expect(org.isInit).to.be.false;
      c.expect(org.id).to.exist;
      c.expect(org.name).to.undefined;
    });
    orgsData.forEach(o => c.expect(o).to.have.all.keys(['id']));

    const orgsDetail = await snet.listOrganizations({init:true});
    const orgsDataDetail = orgsDetail.map(o => o.data);

    c.expect(orgsDetail.length).to.be.greaterThan(0);

    orgsDetail.forEach(org => {
      c.expect(org).to.be.instanceof(Organization);
      c.expect(org).to.be.instanceof(OrganizationSvc);
      c.expect(org.isInit).to.be.true;
      c.expect(org.id).to.exist;
      c.expect(org.services).to.be.instanceof(Array);
    });
    orgsDataDetail.forEach(o => c.expect(o).to.have.all.keys(['id','members','name','owner','services']));

    const orgSnet = orgsDetail.find(o => o.id === 'snet');
    const orgDataSnet = orgsDataDetail.find(o => o.id === 'snet');
    
    c.expect(orgSnet['services'][0]).to.be.instanceof(ServiceSvc);
    c.expect(orgSnet['services'][0].isInit).to.be.false;
    c.expect(orgSnet['services'][0].organizationId).to.be.equal('snet');


    const orgBasic = await snet.getOrganization('snet', {init:false});
    const orgDetail = await snet.getOrganization('snet');

    c.expect(orgBasic.data).to.be.deep.equal({id:'snet'});
    c.expect(orgDetail.data).to.be.deep.equal(orgDataSnet);
  });

  m.it('should list services and service', async function () {
    const snet = await Snet.init(config.web3, {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});

    const snetOrg = await snet.getOrganization('snet');
    const snetSvcs = snetOrg.services;
    const orgExampleSvc = snetSvcs.find(s => s.id === 'example-service');

    const exampleSvc = await snet.getService('snet', 'example-service', {init:false});
    const exampleSvcDetail = await snet.getService('snet', 'example-service');

    c.expect(orgExampleSvc.data).to.be.deep.equal(exampleSvc.data);
    
    await orgExampleSvc.init();

    c.expect(orgExampleSvc.data).to.be.deep.equal(exampleSvcDetail.data);

  });

  m.it('should get account information', async function () {
    const snet = await Snet.init(config.web3, {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});
    const account = snet.account;

    c.expect(account.data).to.be.deep.equal({address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});
  });

  m.it('should get utility is available', async function () {
    const snet = await Snet.init(config.web3, {address:config.PERSONAL_ACCOUNT, privateKey:config.PERSONAL_ACCOUNT_PK});
    const util = snet.utils;

    c.expect(util).to.exist;
  });

})
