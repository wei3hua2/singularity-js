const c = require('chai');
const m = require('mocha');
const {initWeb3, getConfigInfo} = require('./utils');
const {AccountSvc} =  require('../../dist/impls');

let web31, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK,
    TEST_ACCOUNT, TEST_ACCOUNT_PK;

let log = function(s){
    console.log(s);
}

let roundTo8 = function (value) {
    return +(value.toFixed(8));
}

m.before(() => {
    web31 = initWeb3();

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    TEST_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];

    if(!getConfigInfo()['ENABLE_CONSOLE']) 
        log = function(s){}
});
m.after(() => {
    web31.currentProvider.connection.close();
})

m.describe('Account', () => {

    m.xit('should deposit and withdraw tokens', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});

        // await acct.approveEscrow(0.0);
        // await acct.withdrawFromEscrow(5);
        // throw new Error('done');

        // Handle allowance

        const allowance = await acct.escrowAllowance();

        log('current allowance : '+allowance);
        c.expect(allowance).to.be.equal(0);

        const approve = await acct.approveEscrow(1.1);
        const approvedAllowance = await acct.escrowAllowance();

        log('approved allowance  : '+approvedAllowance);
        c.expect(approvedAllowance).to.be.equal(1.1);


        // deposit 1.0 agi

        const originalAgiToken = await acct.getAgiTokens();
        const originalEscrowBalance = await acct.getEscrowBalances();

        log('original tokens : '+ originalAgiToken + ' escrow : '+ originalEscrowBalance);

        log('deposit escrow  1.0 agi token');
        await acct.depositToEscrow(1);

        const depositAgiAgiToken = await acct.getAgiTokens();
        const depositAgiEscrowBalance = await acct.getEscrowBalances();

        c.expect(depositAgiAgiToken).to.be.equal(roundTo8(originalAgiToken - 1.0));
        c.expect(depositAgiEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 1.0));

        // deposit 0.1 agi

        log('deposit escrow  0.1 agi token');
        await acct.depositToEscrow(10000000, {inCogs: true});

        const depositCogsAgiToken = await acct.getAgiTokens();
        const depositCogsEscrowBalance = await acct.getEscrowBalances();

        c.expect(depositCogsAgiToken).to.be.equal(roundTo8(originalAgiToken - 1.1));
        c.expect(depositCogsEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 1.1));


        // withdraw 1 agi

        log('withdraw escrow 1.0 agi token');
        await acct.withdrawFromEscrow(1);

        const withdrawAgiAgiToken = await acct.getAgiTokens();
        const withdrawAgiEscrowBalance = await acct.getEscrowBalances();

        c.expect(withdrawAgiAgiToken).to.be.equal(roundTo8(originalAgiToken - 0.1));
        c.expect(withdrawAgiEscrowBalance).to.be.equal(roundTo8(originalEscrowBalance + 0.1));

        // withdraw 0.1 agi

        log('withdraw escrow  0.1 agi token');
        await acct.withdrawFromEscrow(10000000, {inCogs: true});

        const withdrawCogsAgiToken = await acct.getAgiTokens();
        const withdrawCogsEscrowBalance = await acct.getEscrowBalances();

        c.expect(originalAgiToken).to.be.equal(withdrawCogsAgiToken);
        c.expect(originalEscrowBalance).to.be.equal(withdrawCogsEscrowBalance);


        // restore allowance

        log('restore approval to ' + allowance);
        const restoreApproval = await acct.approveEscrow(allowance * 100000000.0, {inCogs: true});
        const resultAllowance = await acct.escrowAllowance();

        c.expect(resultAllowance).to.be.equal(allowance);

    }).timeout(10 * 60 * 1000);

    m.xit('should transfer test account tokens and back', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});

        const originalAgiToken = await acct.getAgiTokens();
        const testAgiToken = await testAcct.getAgiTokens({inCogs: true});

        log('original tokens : '+ originalAgiToken + ' test tokens : '+ testAgiToken);

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

    m.it('should get account information', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});
        try{
        const agiTokens = await acct.getAgiTokens();
        const escrowBalance = await acct.getEscrowBalances();
        const allowance = await acct.escrowAllowance();
        const channels = await acct.getChannels();

        log('*** PERSONAL ACCOUNT ***');
        log('agiTokens : ' + agiTokens);
        log('escrowBalance : ' + escrowBalance);
        log('escrow allowance : ' + allowance);
        log(channels[0].data);

        c.expect(agiTokens).to.be.greaterThan(0);
        c.expect(escrowBalance).to.be.greaterThan(0);
        c.expect(acct.data['address']).to.be.equal(PERSONAL_ACCOUNT);
        c.expect(acct.data['privateKey']).to.be.equal(PERSONAL_ACCOUNT_PK);
        c.expect(channels.length).to.be.greaterThan(0);
        c.expect(channels[0].data).to.contain.keys(['id']);

        log();

        const testAgiTokens = await testAcct.getAgiTokens();
        const testEscrowBalance = await testAcct.getEscrowBalances();
        const testAllowance = await acct.escrowAllowance();
        const testChannels = await testAcct.getChannels();

        log('*** TEST ACCOUNT ***');
        log('agiTokens : ' + testAgiTokens);
        log('escrowBalance : ' + testEscrowBalance);
        log('escrow allowance : ' + testAllowance);

        c.expect(testAgiTokens).to.be.greaterThan(0);
        c.expect(testAcct.data['address']).to.be.equal(TEST_ACCOUNT);
        c.expect(testAcct.data['privateKey']).to.be.equal(TEST_ACCOUNT_PK);

        }catch(er){console.error(er)}
    }).timeout(500000);

})
