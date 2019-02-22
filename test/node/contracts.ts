import * as c from 'chai';
import * as m from 'mocha';

import {initWeb3, getConfigInfo} from './utils';
import { Account } from '../../src/account';
import {Registry} from '../../src/contracts/registry';


let web3, acct;
let PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY, TEST_ACCOUNT, TEST_ACCOUNT_PRIVATE_KEY;

m.before(async () => {
  web3 = initWeb3();

  PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
  PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
  TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];

  acct = await Account.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
});
m.after(() => {
  web3.currentProvider.connection.close();
})

m.describe.only('Contract', () => {
  m.it('should work for Tokens call functions', async function() {
    const tokens = acct.getTokens();

    const name = await tokens.name();
    const totalSupply = await tokens.totalSupply();
    const INITIAL_SUPPLY = await tokens.INITIAL_SUPPLY();
    const decimals = await tokens.decimals();
    const paused = await tokens.paused();
    const owner = await tokens.owner();
    const symbol = await tokens.symbol();
    const balanceOf = await tokens.balanceOf(PERSONAL_ACCOUNT);
    const allowance = await tokens.allowance(PERSONAL_ACCOUNT, PERSONAL_ACCOUNT);

    c.expect(name).to.equal('SingularityNET Token');
    c.expect(totalSupply).to.equal(100000000000000000);
    c.expect(INITIAL_SUPPLY).to.equal(100000000000000000);
    c.expect(decimals).to.equal(8);
    c.expect(paused).to.be.false;
    c.expect(owner).to.have.string('0x');
    c.expect(symbol).to.equal('AGI');
    c.expect(balanceOf).to.exist;
    c.expect(allowance).to.exist;

    console.log('Tokens call result :');
    console.log('   '+[name, totalSupply, INITIAL_SUPPLY, decimals, paused, owner, symbol, balanceOf, allowance]);
  });

  m.it('should work for MultiPartyEscrow call functions', async function () {
    const mpe = acct.getMpe();

    const balances = await mpe.balances(PERSONAL_ACCOUNT);
    const channel = await mpe.channels(1);
    const nextChannelId = await mpe.nextChannelId();
    const token = await mpe.token();

    c.expect(balances).to.be.greaterThan(1);
    c.expect(nextChannelId).to.be.greaterThan(1);
    c.expect(token).to.have.string('0x');

    c.expect(channel).to.contain.keys(['nonce','signer','recipient','groupId','value','expiration']);
    c.expect(channel.nonce).to.be.greaterThan(-1);
    c.expect(channel.value).to.be.greaterThan(0);
    c.expect(channel.expiration).to.be.greaterThan(-1);

    console.log('MultiParty Escrow call result :');
    console.log('   '+[balances, channel, nextChannelId, token]);
  });

  m.it('should work for Registry call functions', async function () {
    const registry = acct.getRegistry();

    const listOrganizations = await registry.listOrganizations();
    const getOrganizationById = await registry.getOrganizationById('snet');
    const listServicesForOrganization = await registry.listServicesForOrganization('snet');
    const getServiceRegistrationById = await registry.getServiceRegistrationById('snet', 'example-service');
    const listServiceTags = await registry.listServiceTags();
    const listServicesForTag = await registry.listServicesForTag('Recognition');

    c.expect(listOrganizations[0]).to.be.equal('snet');
    c.expect(getOrganizationById).to.contain.keys(['found','id','name','owner','members','serviceIds']);
    c.expect(listServicesForOrganization).to.contain.keys(['found','serviceIds']);
    c.expect(getServiceRegistrationById).to.contain.keys(['found','id','metadataURI','tags']);
    c.expect(listServiceTags.tags.length).to.be.greaterThan(1);
    c.expect(listServicesForTag).to.contain.keys(['orgIds','serviceIds']);

    console.log('Registry call result :');
    console.log('   '
      +[listOrganizations, getOrganizationById, listServicesForOrganization, getServiceRegistrationById, 
        listServiceTags, listServicesForTag]);
  });


  m.it('Tokens: should transfer 1 cog from one account to another ', async function () {
    const tokens = acct.getTokens(), TRANSFER_VALUE = 1;

    const balanceOfB4 = await tokens.balanceOf(TEST_ACCOUNT);

    const receipt = await tokens.transfer(TEST_ACCOUNT, TRANSFER_VALUE);

    c.expect(receipt).to.contain.keys(['status','blockHash','blockNumber', 'transactionHash','transactionIndex']);
    c.expect(receipt.status).to.be.equal('0x1');

      const balanceOfAfter = await tokens.balanceOf(TEST_ACCOUNT);

      c.expect(balanceOfB4 + 1).to.be.equal(parseInt(balanceOfAfter));

      console.log('address '+TEST_ACCOUNT+' cogs increase from '+balanceOfB4+ ' to '+balanceOfAfter);
    
  }).timeout(10 * 60 * 1000);

  m.it('Registry: should perform basic CRUD for organization and service', async function () {
    const registry:Registry = acct.getRegistry();
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


    
    // const registry = acct.getRegistry();

    // const tmp = await registry.listOrganizations();
    // const tmp = await registry.getOrganizationById('snet');
    // const tmp = await registry.listServicesForOrganization('jameschong');
    // const tmp = await registry.getServiceRegistrationById('snet', 'example-service');
    // const tmp = await registry.listServiceTags();
    // const tmp = await registry.listServicesForTag('Recognition');

    // console.log(tmp)
})
