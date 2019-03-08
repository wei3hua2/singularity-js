import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {AccountSvc} from '../../src/impls/account';

let web31, web32, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK,
    TEST_ACCOUNT, TEST_ACCOUNT_PK;

m.before(() => {
    web31 = initWeb3();

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    TEST_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
});
m.after(() => {
    web31.currentProvider.connection.close();
})

m.describe('Account', () => {

    m.xit('should transfer for main to test account', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});

        console.log('transferring to test account...');

        const response = await acct.transfer(testAcct, 10);
        console.log(response);

        const approval = await acct.approveEscrow(10);
        console.log(approval);

        const escrowAllowance = await acct.escrowAllowance();
        console.log('depositing to escrow... allowance : '+escrowAllowance);
        
        const deposit = await acct.depositToEscrow(10);
        console.log(deposit);

    }).timeout(10 * 60 * 1000);

    m.it('should get account information', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});
        try{
        const agiTokens = await acct.getAgiTokens();
        const escrowBalance = await acct.getEscrowBalances();
        const allowance = await acct.escrowAllowance();
        const channels = await acct.getChannels();

        console.log('*** PERSONAL ACCOUNT ***');
        console.log('agiTokens : ' + agiTokens);
        console.log('escrowBalance : ' + escrowBalance);
        console.log('escrow allowance : ' + allowance);
        console.log(channels[0].data);

        c.expect(agiTokens).to.be.greaterThan(0);
        c.expect(escrowBalance).to.be.greaterThan(0);
        c.expect(acct.data['address']).to.be.equal(PERSONAL_ACCOUNT);
        c.expect(acct.data['privateKey']).to.be.equal(PERSONAL_ACCOUNT_PK);
        c.expect(channels.length).to.be.greaterThan(0);
        c.expect(channels[0].data).to.contain.keys(
            ['id', 'nonce', 'sender', 'recipient','signer','value','expiration','groupId']);

        console.log();

        const testAgiTokens = await testAcct.getAgiTokens();
        const testEscrowBalance = await testAcct.getEscrowBalances();
        const testAllowance = await acct.escrowAllowance();
        const testChannels = await testAcct.getChannels();

        console.log('*** TEST ACCOUNT ***');
        console.log('agiTokens : ' + testAgiTokens);
        console.log('escrowBalance : ' + testEscrowBalance);
        console.log('escrow allowance : ' + testAllowance);

        c.expect(testAgiTokens).to.be.greaterThan(0);
        c.expect(testAcct.data['address']).to.be.equal(TEST_ACCOUNT);
        c.expect(testAcct.data['privateKey']).to.be.equal(TEST_ACCOUNT_PK);

        }catch(er){console.error(er)}
    }).timeout(500000);
})
