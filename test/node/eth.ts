import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {EthUtil} from '../../src/eth';

//@ts-ignore
import AGITokenNetworks from 'singularitynet-token-contracts/networks/SingularityNetToken.json';
//@ts-ignore
import AGITokenAbi from 'singularitynet-token-contracts/abi/SingularityNetToken.json';

let web3, eth, contract, PERSONAL_ACCOUNT, PERSONAL_ACCOUNT_PK, TEST_ACCOUNT, TEST_ACCOUNT_PK, CHAINID;

m.before(() => {
    web3 = initWeb3();
    eth = new EthUtil(web3);

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_ACCOUNT_PK = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    // TEST_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
    CHAINID = getConfigInfo()['CHAINID'];
    contract = eth.getContract(AGITokenAbi, AGITokenNetworks[CHAINID].address);
});
m.after(() => {
    eth.close();
})

m.describe.only('Eth', () => {
  m.it('should ensure basic information is valid', async function() {
    const version = eth.getWeb3Version();
    const netId = await eth.getNetworkId();
    const blockNo = await eth.getBlockNumber();
    const accounts = await eth.getAccounts();

    console.log('version  : ' + version);
    console.log('netId    : ' + netId);
    console.log('accounts : ' + accounts);
    console.log('blockNo  : ' + blockNo);

    c.expect(version).to.have.string('1.0.0');
    c.expect(netId).to.equal(42);
    c.expect(typeof accounts).to.equal('object');
    c.expect(blockNo).to.be.greaterThan(1000000);
  });

  m.it('should perform basic conversion', async function() {
    const testStr: string = "hello world";
    const testNum: number = 1234567890;

    const utf8Hex = eth.utf8ToHex(testStr);
    const hexUtf8 = eth.hexToUtf8(utf8Hex);

    c.expect(hexUtf8).to.be.equal(testStr);

    const asciiHex = eth.asciiToHex(testStr);
    const hexAscii = eth.hexToAscii(asciiHex);

    // c.expect(hexAscii).to.be.equal(testStr);

    const numHex = eth.numberToHex(testNum);
    const hexNum = eth.hexToNumber(numHex);

    c.expect(hexNum).to.be.equal(testNum);

    const hexBytes = eth.hexToBytes(asciiHex);
    const bytesHex = eth.bytesToHex(hexBytes);

    c.expect(hexNum).to.be.equal(testNum);

    const base64Ascii = eth.utf8ToBase64(testStr);
    const asciiBase64 = eth.base64ToUtf8(base64Ascii);

    c.expect(asciiBase64).to.be.equal(testStr);

    const numBytesTest = eth.numberToBytes(testNum);
    const bytesNumTest = eth.bytesToNumber(numBytesTest);

    c.expect(bytesNumTest).to.be.equal(testNum);

    const numBytes = eth.numberToBytes(10,4);
    const bytesNum = eth.bytesToNumber(numBytes);

    c.expect(numBytes.length).to.be.equal(4);
    c.expect(bytesNum).to.be.equal(10);


    const sha3Message: string = eth.soliditySha3({t: 'uint256', v: 120});
    const signed = await eth.sign(sha3Message, {privateKey:PERSONAL_ACCOUNT_PK});

    c.expect(sha3Message).to.have.string('0x');
    c.expect(signed).to.have.keys(['signature','message','messageHash','v','r','s']);

    
    console.log('utf8-hex  :' + utf8Hex + ' : ' + hexUtf8);
    console.log('ascii-hex : ' + asciiHex + ' : ' + hexAscii);
    console.log('number-hex : ' + numHex + ' : ' + hexNum);
    console.log('hex-bytes : ' + hexBytes + ' : ' + bytesHex);
    console.log('base64-ascii : ' + base64Ascii + ' : ' + asciiBase64);
    console.log('number-bytes : ' + numBytes + ' : ' + bytesNum);
  });

  m.it('should call token contract to get available tokens', async function () {
    const symbol = await eth.call(contract, 'symbol');
    c.expect(symbol).to.be.equal('AGI');

    const balance = (await eth.call(contract, 'balanceOf', TEST_ACCOUNT)).balance;
    c.expect(parseInt(balance)).to.be.greaterThan(0);

    console.log('Address : '+TEST_ACCOUNT);
    console.log('Symbol : '+symbol);
    console.log('Balance : '+balance);
  });

  m.it('should transfer 1 cog to TEST_ACCOUNT', async function () {
    const testAcctBalance = (await eth.call(contract, 'balanceOf', TEST_ACCOUNT)).balance;

    const receipt = await eth.transact(PERSONAL_ACCOUNT_PK, 
                contract, 'transfer', AGITokenNetworks[CHAINID].address, 
                {from: PERSONAL_ACCOUNT}, TEST_ACCOUNT, 1);
    const log = receipt.logs[receipt.logs.length-1];

    c.expect(receipt).to.have.keys(['gas','nonce','transactionIndex','transactionHash','to','status',
      'root','logsBloom','logs','gasUsed','from','cumulativeGasUsed','contractAddress','blockNumber','blockHash']);

    c.expect(log).to.have.keys(['type','transactionLogIndex','transactionIndex','transactionHash',
      'topics','removed','logIndex','data','blockNumber','blockHash','address']);

    const testAcctBalanceAfter = (await eth.call(contract, 'balanceOf', TEST_ACCOUNT)).balance;

    console.log('cogs : '+testAcctBalance+ ' => '+testAcctBalanceAfter);

    c.expect(parseInt(testAcctBalance) + 1).to.be.equal(parseInt(testAcctBalanceAfter));
  }).timeout(50000);
})
