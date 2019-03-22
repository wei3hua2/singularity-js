const c = require('chai');
const m = require('mocha');
const {Config} = require('../config/config');

let config;

let roundTo8 = function (value) {
    return +(value.toFixed(8));
}

m.before(async () => {
    config = await Config.init();
});
m.after(() => {
    config.teardown();
})

m.describe('account-call', () => {

    m.it('should get account information', async function () {
        
        c.expect(config.acct1.clientType).to.be.equal('privatekey');
        c.expect(config.acct2.clientType).to.be.equal('privatekey');

        const agiTokens = await config.acct1.getAgiTokens();
        const cogTokens = await config.acct1.getAgiTokens({inCogs: true});
        const escrowBalance = await config.acct1.getEscrowBalances();
        const escrowCogBalance = await config.acct1.getEscrowBalances({inCogs:true});
        const allowance = await config.acct1.escrowAllowance();
        const cogAllowance = await config.acct1.escrowAllowance({inCogs:true});
        const channels = await config.acct1.getChannels();
        const channelsDetail = await config.acct1.getChannels({},{init:true});

        config.log('*** PERSONAL ACCOUNT ***');
        config.log('agiTokens : ' + agiTokens+` (${cogTokens})`);
        config.log('escrowBalance : ' + escrowBalance+` (${escrowCogBalance} cogs)`);
        config.log('escrow allowance : ' + allowance+` (${cogAllowance} cogs)`);
        config.log(channels[0].data);
        config.log(channelsDetail[0].data);

        c.expect(agiTokens).to.be.greaterThan(0);
        c.expect(escrowBalance).to.be.greaterThan(0);
        c.expect(config.acct1.data['address']).to.be.equal(config.PERSONAL_ACCOUNT);
        c.expect(config.acct1.data['privateKey']).to.be.equal(config.PERSONAL_ACCOUNT_PK);
        c.expect(channels.length).to.be.greaterThan(0);
        c.expect(channels[0].data).to.have.all.keys(['id']);
        c.expect(channelsDetail[0].data).to.have.all.keys(['id','sender','signer','recipient','groupId']);

        c.expect(agiTokens).to.be.equal(cogTokens / 100000000.0);
        c.expect(escrowBalance).to.be.equal(escrowCogBalance / 100000000.0);
        c.expect(allowance).to.be.equal(cogAllowance / 100000000.0);


        const testAgiTokens = await config.acct2.getAgiTokens();
        const testEscrowBalance = await config.acct2.getEscrowBalances();
        const testAllowance = await config.acct2.escrowAllowance();
        const testChannels = await config.acct2.getChannels();

        config.log('*** TEST ACCOUNT ***');
        config.log('agiTokens : ' + testAgiTokens);
        config.log('escrowBalance : ' + testEscrowBalance);
        config.log('escrow allowance : ' + testAllowance);

        c.expect(testAgiTokens).to.be.greaterThan(0);
        c.expect(config.acct2.data['address']).to.be.equal(config.TEST_ACCOUNT);
        c.expect(config.acct2.data['privateKey']).to.be.equal(config.TEST_ACCOUNT_PK);

    });

})
