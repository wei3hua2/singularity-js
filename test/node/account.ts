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

m.describe('AccountSvc', () => {

    m.xit('should transfer for main to test account', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});

        const response = await acct.transfer(testAcct, 10);
        console.log(response);

        const deposit = await acct.depositToEscrow(1000);
        console.log(deposit);

    }).timeout(50000);

    m.xit('should deposit to escrow', async function () {

    });

    m.xit('should withdraw from escrow', async function () {

    });

    m.it('should get account information', async function () {
        const acct = await AccountSvc.create(web31, {address:PERSONAL_ACCOUNT,privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = await AccountSvc.create(web31, {address:TEST_ACCOUNT,privateKey:TEST_ACCOUNT_PK});
        try{
        const agiTokens = await acct.getAgiTokens();
        const escrowBalance = await acct.getEscrowBalances();

        console.log('address : ' + acct.address);
        console.log('agiTokens : ' + agiTokens);
        console.log('escrowBalance : ' + escrowBalance);

        console.log();

        const testAgiTokens = await testAcct.getAgiTokens();
        const testEscrowBalance = await testAcct.getEscrowBalances();

        console.log('address : ' + testAcct.address);
        console.log('agiTokens : ' + testAgiTokens);
        console.log('escrowBalance : ' + testEscrowBalance);
        }catch(er){console.error(er)}
    });
})
