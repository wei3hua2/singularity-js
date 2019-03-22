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

m.describe('account-state', () => {

    m.it('should deposit and withdraw tokens from escrow', async function () {
        const acct = config.acct1

        // Handle allowance

        const allowance = await acct.escrowAllowance();
        config.log('current allowance : '+allowance);

        const approve = await acct.approveEscrow(1.1);
        const approvedAllowance = await acct.escrowAllowance();

        config.log('approved allowance  : '+approvedAllowance);
        c.expect(approvedAllowance).to.be.equal(1.1);


        // deposit 1.0 agi

        const originalAgiToken = await acct.getAgiTokens();
        const originalEscrowBalance = await acct.getEscrowBalances();

        config.log('original tokens : '+ originalAgiToken + ' escrow : '+ originalEscrowBalance);

        config.log('deposit escrow  1.0 agi token');
        await acct.depositToEscrow(1);

        const depositAgiAgiToken = await acct.getAgiTokens();
        const depositAgiEscrowBalance = await acct.getEscrowBalances();

        c.expect(depositAgiAgiToken).to.be.equal(roundTo8(originalAgiToken - 1.0));
        c.expect(depositAgiEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 1.0));

        // deposit 0.1 agi

        config.log('deposit escrow  0.1 agi token');
        await acct.depositToEscrow(10000000, {inCogs: true});

        const depositCogsAgiToken = await acct.getAgiTokens();
        const depositCogsEscrowBalance = await acct.getEscrowBalances();

        c.expect(depositCogsAgiToken).to.be.equal(roundTo8(originalAgiToken - 1.1));
        c.expect(depositCogsEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 1.1));


        // withdraw 1 agi

        config.log('withdraw escrow 1.0 agi token');
        await acct.withdrawFromEscrow(1);

        const withdrawAgiAgiToken = await acct.getAgiTokens();
        const withdrawAgiEscrowBalance = await acct.getEscrowBalances();

        c.expect(withdrawAgiAgiToken).to.be.equal(roundTo8(originalAgiToken - 0.1));
        c.expect(withdrawAgiEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 0.1));

        // withdraw 0.1 agi

        config.log('withdraw escrow  0.1 agi token');
        await acct.withdrawFromEscrow(10000000, {inCogs: true});

        const withdrawCogsAgiToken = await acct.getAgiTokens();
        const withdrawCogsEscrowBalance = await acct.getEscrowBalances();

        c.expect(originalAgiToken).to.be.equal(withdrawCogsAgiToken);
        c.expect(originalEscrowBalance).to.be.equal(withdrawCogsEscrowBalance);


        // restore allowance

        config.log('restore approval to ' + allowance);
        const restoreApproval = await acct.approveEscrow(allowance * 100000000.0, {inCogs: true});
        const resultAllowance = await acct.escrowAllowance();

        c.expect(resultAllowance).to.be.equal(allowance);

    }).timeout(10 * 60 * 1000);

    m.it('should transfer test account tokens and back', async function () {
        const acct = config.acct1
        const testAcct = config.acct2;

        const originalAgiToken = await acct.getAgiTokens();
        const testAgiToken = await testAcct.getAgiTokens({inCogs: true});

        config.log('original tokens : '+ originalAgiToken + ' test tokens : '+ testAgiToken);

        await acct.transfer(testAcct, 1);

        const agiAgiToken = await acct.getAgiTokens();
        const testAgiAgiToken = await testAcct.getAgiTokens({inCogs: true});

        c.expect(agiAgiToken).to.be.equal(originalAgiToken - 1.0);
        c.expect(testAgiAgiToken).to.be.equal(testAgiToken + 100000000);

        await acct.transfer(testAcct, 10000000, {inCogs:true});

        const cogAgiToken = await acct.getAgiTokens();
        const testCogAgiToken = await testAcct.getAgiTokens({inCogs: true});

        c.expect(cogAgiToken).to.be.equal(roundTo8(originalAgiToken - 1.1));
        c.expect(testCogAgiToken).to.be.equal(testAgiToken + 110000000);

        await testAcct.transfer(acct.address, 1.1);

        const finalAgiToken = await acct.getAgiTokens();
        const testFinalAgiToken = await testAcct.getAgiTokens({inCogs: true});

        c.expect(finalAgiToken).to.be.equal(roundTo8(originalAgiToken));
        c.expect(testFinalAgiToken).to.be.equal(testAgiToken);

    }).timeout(10 * 60 * 1000);

})
