import * as c from 'chai';
import * as m from 'mocha';

import {Snet} from '../../src/snet';

import {initWeb3, getConfigInfo} from './utils';
import { Account } from '../../src/account';


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

  m.it('Registry: should  ', async function () {
  }).timeout(10 * 60 * 1000);


    
    // const registry = acct.getRegistry();

    // const tmp = await registry.listOrganizations();
    // const tmp = await registry.getOrganizationById('snet');
    // const tmp = await registry.listServicesForOrganization('jameschong');
    // const tmp = await registry.getServiceRegistrationById('snet', 'example-service');
    // const tmp = await registry.listServiceTags();
    // const tmp = await registry.listServicesForTag('Recognition');

    // console.log(tmp)
})
