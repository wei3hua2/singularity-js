import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Eth} from '../../src/eth';
import {Mpe} from '../../src/contracts/mpe';
import {Tokens} from '../../src/contracts/tokens';
import {Registry} from '../../src/contracts/registry';
import {Account} from '../../src/account';

let web3, eth, mpe, registry, tokens, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK,
    TEST_ACCOUNT, TEST_ACCOUNT_PK;

m.before(() => {
    web3 = initWeb3(), eth = new Eth(web3), 
    registry = new Registry(eth), mpe = new Mpe(eth), tokens = new Tokens(eth);

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    TEST_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
});
m.after(() => {
    eth.close();
})

m.describe('Account', () => {
    m.xit('should get current account', async function () {
        const curAccts = await Account.getCurrentAccounts(web3);

        c.expect(curAccts.length).to.be.equals(0);
    });

    m.it('should transfer for main to test account', async function () {
        const acct = Account.create(web3, {id:PERSONAL_ACCOUNT}, {privateKey:PERSONAL_ACCOUNT_PK});
        const testAcct = Account.create(web3, {id:TEST_ACCOUNT}, {privateKey:TEST_ACCOUNT_PK});

        const response = await acct.transfer(testAcct, 10);
        console.log(response);

        const deposit = await acct.depositToEscrow(1000);
        console.log(deposit);

    }).timeout(30000);

    m.xit('should deposit to escrow', async function () {

    });

    m.xit('should withdraw from escrow', async function () {

    });

    m.it('should get account information', async function () {
        const acct = Account.create(web3, {id:PERSONAL_ACCOUNT});
        const testAcct = Account.create(web3, {id:TEST_ACCOUNT});
        
        const agiTokens = await acct.getAgiTokens();
        const escrowBalance = await acct.getEscrowBalances();

        console.log('address : ' + acct.id);
        console.log('agiTokens : ' + agiTokens);
        console.log('escrowBalance : ' + escrowBalance);

        console.log();

        const testAgiTokens = await testAcct.getAgiTokens();
        const testEscrowBalance = await testAcct.getEscrowBalances();

        console.log('address : ' + testAcct.id);
        console.log('agiTokens : ' + testAgiTokens);
        console.log('escrowBalance : ' + testEscrowBalance);
    });
})
