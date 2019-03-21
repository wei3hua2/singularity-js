const c = require('chai');
const m = require('mocha');
const {Config} = require('../config/config');

let config, log;

let roundTo8 = function (value) {
    return +(value.toFixed(8));
}

m.before(async () => {
    config = await Config.init();
    log = config.log;
});
m.after(() => {
    config.teardown();
})

m.describe('account-call', () => {

    m.it('should get account information', async function () {
        
        const agiTokens = await config.acct1.getAgiTokens();
        const escrowBalance = await config.acct1.getEscrowBalances();
        const allowance = await config.acct1.escrowAllowance();
        const channels = await config.acct1.getChannels();

        log('*** PERSONAL ACCOUNT ***');
        log('agiTokens : ' + agiTokens);
        log('escrowBalance : ' + escrowBalance);
        log('escrow allowance : ' + allowance);
        log(channels[0].data);

        c.expect(agiTokens).to.be.greaterThan(0);
        c.expect(escrowBalance).to.be.greaterThan(0);
        c.expect(config.acct1.data['address']).to.be.equal(config.PERSONAL_ACCOUNT);
        c.expect(config.acct1.data['privateKey']).to.be.equal(config.PERSONAL_ACCOUNT_PK);
        c.expect(channels.length).to.be.greaterThan(0);
        c.expect(channels[0].data).to.contain.keys(['id']);

        log();

        const testAgiTokens = await config.acct2.getAgiTokens();
        const testEscrowBalance = await config.acct2.getEscrowBalances();
        const testAllowance = await config.acct2.escrowAllowance();
        const testChannels = await config.acct2.getChannels();

        log('*** TEST ACCOUNT ***');
        log('agiTokens : ' + testAgiTokens);
        log('escrowBalance : ' + testEscrowBalance);
        log('escrow allowance : ' + testAllowance);

        c.expect(testAgiTokens).to.be.greaterThan(0);
        c.expect(config.acct2.data['address']).to.be.equal(config.TEST_ACCOUNT);
        c.expect(config.acct2.data['privateKey']).to.be.equal(config.TEST_ACCOUNT_PK);

    }).timeout(500000);

})
