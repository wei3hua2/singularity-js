const c = require('chai');
const m = require('mocha');

const {Config} = require('../config/config');

const { AccountSvc } = require('../../dist/impls/account');
const {Registry} = require('../../dist/contracts/registry');
const {Mpe} = require('../../dist/contracts/mpe');
const {Tokens} = require('../../dist/contracts/tokens');
const {Ipfs} = require('../../dist/utils/ipfs');

let config;

m.before(async () => {
  config = await Config.init();
  log = config.log;
});
m.after(async () => {
  config.teardown();
})

m.describe('contract-state', () => {

  m.it('Tokens: should transfer 1 cog from one account to another ', async function () {
    const tokens = config.acct1.tokens, TRANSFER_VALUE = 1;

    const balanceOfB4 = await tokens.balanceOf(TEST_ACCOUNT);

    const receipt = await tokens.transfer(TEST_ACCOUNT, TRANSFER_VALUE);

    c.expect(receipt).to.contain.keys(['status','blockHash','blockNumber', 'transactionHash','transactionIndex']);
    c.expect(receipt.status).to.be.equal('0x1');

      const balanceOfAfter = await tokens.balanceOf(TEST_ACCOUNT);

      c.expect(balanceOfB4 + 1).to.be.equal(parseInt(balanceOfAfter));

      console.log('address '+TEST_ACCOUNT+' cogs increase from '+balanceOfB4+ ' to '+balanceOfAfter);
    
  }).timeout(10 * 60 * 1000);

  m.it('Registry: should perform basic CRUD for organization and service', async function () {
    const registry = config.acct1.registry;
    const ORG_ID = 'snet-js-test', ORG_NAME = 'Snet Js Test';
    const SVC_ID = 'snet-js-test-svc', METADATAURI = 'fake_metadata_uri', TAGS = [];
    let org, svcReg;

    // **** 1. create organization
    await registry.createOrganization(ORG_ID);

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.found).to.be.true;
    c.expect(org.id).to.be.equal(ORG_ID);
    c.expect(org.name).to.be.empty;
    c.expect(org.owner).to.be.equal(PERSONAL_ACCOUNT);
    c.expect(org.members).to.be.empty;
    c.expect(org.serviceIds).to.be.empty;
    
    console.log('1. Org id created => '+ORG_ID);

    // **** 2. change organization name
    await registry.changeOrganizationName(ORG_ID, ORG_NAME);

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.found).to.be.true;
    c.expect(org.id).to.be.equal(ORG_ID);
    c.expect(org.name).to.be.equal(ORG_NAME);
    c.expect(org.owner).to.be.equal(PERSONAL_ACCOUNT);
    c.expect(org.members).to.be.empty;
    c.expect(org.serviceIds).to.be.empty;

    console.log('2. Org name changed => '+org.name);

    // **** 3. add member
    await registry.addOrganizationMembers(ORG_ID, [TEST_ACCOUNT]);

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.found).to.be.true;
    c.expect(org.id).to.be.equal(ORG_ID);
    c.expect(org.name).to.be.equal(ORG_NAME);
    c.expect(org.owner).to.be.equal(PERSONAL_ACCOUNT);
    c.expect(org.members).to.be.deep.equal([TEST_ACCOUNT]);
    c.expect(org.serviceIds).to.be.empty;

    console.log('3. Org member created => '+org.members);

    // **** 4. remove member
    await registry.removeOrganizationMembers(ORG_ID, [TEST_ACCOUNT]);

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.found).to.be.true;
    c.expect(org.id).to.be.equal(ORG_ID);
    c.expect(org.name).to.be.equal(ORG_NAME);
    c.expect(org.owner).to.be.equal(PERSONAL_ACCOUNT);
    c.expect(org.members).to.be.empty
    c.expect(org.serviceIds).to.be.empty;

    console.log('4. Org member removed => '+[TEST_ACCOUNT]);

    // **** 5. create service registration
    await registry.createServiceRegistration(ORG_ID, SVC_ID);

    svcReg = await registry.getServiceRegistrationById(ORG_ID, SVC_ID);

    c.expect(svcReg.found).to.be.true;
    c.expect(svcReg.id).to.be.equal(SVC_ID);
    c.expect(svcReg.metadataURI).to.be.empty;
    c.expect(svcReg.tags).to.be.empty;

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.serviceIds).to.be.deep.equal([SVC_ID]);

    console.log('5. Svc created => '+SVC_ID);


    // **** 6. update service registration
    await registry.updateServiceRegistration(ORG_ID, SVC_ID, METADATAURI+'_updated');

    svcReg = await registry.getServiceRegistrationById(ORG_ID, SVC_ID);

    c.expect(svcReg.found).to.be.true;
    c.expect(svcReg.id).to.be.equal(SVC_ID);
    c.expect(svcReg.metadataURI).to.be.equal(METADATAURI+'_updated');
    c.expect(svcReg.tags).to.be.empty;

    console.log('6. Svc updated => '+SVC_ID);


    const UPDATED_TAGS = ['snet-js-tag1','snet-js-tag2'];

    // **** 7. add tags to service registration
    await registry.addTagsToServiceRegistration(ORG_ID, SVC_ID, UPDATED_TAGS);

    svcReg = await registry.getServiceRegistrationById(ORG_ID, SVC_ID);

    c.expect(svcReg.found).to.be.true;
    c.expect(svcReg.id).to.be.equal(SVC_ID);
    c.expect(svcReg.metadataURI).to.be.equal(METADATAURI+'_updated');
    c.expect(svcReg.tags).to.be.deep.equal(UPDATED_TAGS);

    console.log('7. Svc tag created => '+svcReg.tags);


    // **** 8. remove tags from service registration
    await registry.removeTagsFromServiceRegistration(ORG_ID, SVC_ID, UPDATED_TAGS);

    svcReg = await registry.getServiceRegistrationById(ORG_ID, SVC_ID);

    c.expect(svcReg.found).to.be.true;
    c.expect(svcReg.id).to.be.equal(SVC_ID);
    c.expect(svcReg.metadataURI).to.be.equal(METADATAURI+'_updated');
    c.expect(svcReg.tags).to.be.empty;

    console.log('8. Svc tag removed => '+UPDATED_TAGS);


    // **** 9. delete service registration
    await registry.deleteServiceRegistration(ORG_ID, SVC_ID);

    svcReg = await registry.getServiceRegistrationById(ORG_ID, SVC_ID);

    c.expect(svcReg.found).to.be.false;

    console.log('9. Svc registration removed => '+SVC_ID);


    // **** 10. delete organization
    await registry.deleteOrganization(ORG_ID);

    org = await registry.getOrganizationById(ORG_ID);

    c.expect(org.found).to.be.false;

    console.log('10. Org removed => '+!org.found);

  }).timeout(10 * 10 * 60 * 1000);

  m.it('Mpe: should perform basic transfer of funds', async function () {
    const mpe = config.acct1.mpe, token = config.acct1.tokens;

    const initBalance = await mpe.balances(PERSONAL_ACCOUNT);
    const initAgiBalance = await token.balanceOf(PERSONAL_ACCOUNT);

    const initTestBalance = await mpe.balances(TEST_ACCOUNT);

    let allowance = await token.allowance(PERSONAL_ACCOUNT, mpe.address);
    
    if(allowance < 100) 
      await token.approve(mpe.address, 100);
    
    allowance = await token.allowance(PERSONAL_ACCOUNT, mpe.address);

    console.log('init balance       : '+initBalance);
    console.log('init AGI balance   : '+initAgiBalance);
    console.log('init test balance  : '+initTestBalance);
    console.log('allowance          : '+allowance);
    console.log();
    

    await mpe.deposit(100);
    
    const depositBalance = await mpe.balances(PERSONAL_ACCOUNT);
    const depositAgiBalance = await token.balanceOf(PERSONAL_ACCOUNT);

    c.expect(initBalance).to.be.equal(depositBalance - 100);
    c.expect(initAgiBalance).to.be.equal(depositAgiBalance + 100);

    console.log('deposit balance       : '+depositBalance);
    console.log('deposit AGI balance   : '+depositAgiBalance);
    console.log();


    await mpe.transfer(TEST_ACCOUNT, 50);

    const depositTestBalance = await mpe.balances(TEST_ACCOUNT);

    c.expect(depositTestBalance).to.be.equal(initTestBalance + 50);

    console.log('init transferred test balance   : '+initTestBalance);
    console.log('final transferred test balance  : '+depositTestBalance);
    console.log();


    await mpe.withdraw(50);
    const finalBalance = await mpe.balances(PERSONAL_ACCOUNT);
    const finalAgiBalance = await token.balanceOf(PERSONAL_ACCOUNT);

    console.log('final balance       : '+finalBalance);
    console.log('final AGI balance   : '+finalAgiBalance);
    console.log();

    c.expect(initBalance).to.be.equal(finalBalance);
    c.expect(initAgiBalance).to.be.equal(finalAgiBalance + 50);


  }).timeout(3 * 10 * 60 * 1000);

  m.it('Mpe: should perform operation on channel', async function () {
    const mpe = config.acct1.mpe;
    const registry = config.acct1.registry;

    const exampleSvcReg = await registry.getServiceRegistrationById('snet','example-service');
    const metadata = await Ipfs.cat(exampleSvcReg.metadataURI);
    const group = metadata.groups[0];
    const groupId = group['group_id'];
    const recipient = group['payment_address'];

    // 1. open channel if not found
    let openedChannel = await mpe.PastChannelOpen(
      {filter:{sender:PERSONAL_ACCOUNT, recipient:recipient, groupId:groupId}});

    console.log('last available channel  :');
    console.log(openedChannel[openedChannel.length-1] ? openedChannel[openedChannel.length-1].returnValues : 'not found');
    console.log();

    if(openedChannel.length===0) {
      const receipt = await mpe.openChannel(PERSONAL_ACCOUNT, group['payment_address'], group['group_id'], 0, 0);

      openedChannel = await mpe.PastChannelOpen({filter:{sender:PERSONAL_ACCOUNT, recipient:recipient, groupId:groupId}});
    }
    
    // 2. extend expiry and top up funds

    const channelId = openedChannel[openedChannel.length - 1].returnValues.channelId;
    const initChannel = await mpe.channels(channelId);

    await mpe.channelExtendAndAddFunds(channelId, initChannel.expiration + 10, 10);

    const topupChannel = await mpe.channels(channelId);

    console.log('topup channel value       :'+topupChannel.value);
    console.log('topup channel expiration  :'+topupChannel.expiration);
    console.log();

    c.expect(initChannel.value).to.be.equal(topupChannel.value - 10);
    c.expect(initChannel.expiration).to.be.equal(topupChannel.expiration - 10);


    // 3. claim channel

    const fundedBalance =  await mpe.balances(PERSONAL_ACCOUNT);

    await mpe.channelClaimTimeout(channelId);
    
    const finalBalance =  await mpe.balances(PERSONAL_ACCOUNT);


    console.log('funded balance   :' + fundedBalance);
    console.log('final balance    :' + finalBalance);
    console.log();

    c.expect(finalBalance).to.be.greaterThan(fundedBalance);

  }).timeout(10 * 60 * 1000);

})
