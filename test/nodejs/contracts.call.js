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

m.describe('contract-call', () => {
  m.it('should work for Tokens call functions', async function() {
    const tokens = config.acct1.tokens;

    const name = await tokens.name();
    const totalSupply = await tokens.totalSupply();
    const INITIAL_SUPPLY = await tokens.INITIAL_SUPPLY();
    const decimals = await tokens.decimals();
    const paused = await tokens.paused();
    const owner = await tokens.owner();
    const symbol = await tokens.symbol();
    const balanceOf = await tokens.balanceOf(config.PERSONAL_ACCOUNT);
    const allowance = await tokens.allowance(config.PERSONAL_ACCOUNT, config.PERSONAL_ACCOUNT);

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
    const mpe = config.acct1.mpe;

    const balances = await mpe.balances(config.PERSONAL_ACCOUNT);
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
    const registry = config.acct1.registry;

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

})
