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
    c.expect(netId).to.equal(3);
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

    
    // console.log('utf8-hex  :' + utf8Hex + ' : ' + hexUtf8);
    // console.log('ascii-hex : ' + asciiHex + ' : ' + hexAscii);
    // console.log('number-hex : ' + numHex + ' : ' + hexNum);
    // console.log('hex-bytes : ' + hexBytes + ' : ' + bytesHex);
    // console.log('base64-ascii : ' + base64Ascii + ' : ' + asciiBase64);
    // console.log('number-bytes : ' + numBytes + ' : ' + bytesNum);
  });

  m.it('should call token contract to get available tokens', async function () {
    const symbol = await eth.call(contract, 'symbol');
    c.expect(symbol).to.be.equal('AGI');

    const balance = (await eth.call(contract, 'balanceOf', PERSONAL_ACCOUNT)).balance;
    c.expect(parseInt(balance)).to.be.greaterThan(0);

    const balanceTest = (await eth.call(contract, 'balanceOf', TEST_ACCOUNT)).balance;
    c.expect(parseInt(balance)).to.be.greaterThan(0);

    console.log('Address : '+TEST_ACCOUNT);
    console.log('Symbol : '+symbol);
    console.log('Balance (Personal): '+balance);
    console.log('Balance (Test): '+balanceTest);
  });

  m.xit('should transfer 1 cog to TEST_ACCOUNT', function (done) {
    // let testAcctBalance = (await eth.call(contract, 'balanceOf', TEST_ACCOUNT)).balance;
    let testAcctBalance;

    

    eth.call(contract, 'balanceOf', TEST_ACCOUNT).then((resp) => {
      testAcctBalance = resp.balance;
      const promi = eth.transact(PERSONAL_ACCOUNT_PK, 
                                 contract, 'transfer', AGITokenNetworks[CHAINID].address, 
                                 {from: PERSONAL_ACCOUNT}, TEST_ACCOUNT, 1);

      promi.on('signed', (signedPl) => {
        c.expect(signedPl).to.contain.keys(['rawTransaction']);
      });
      promi.on('receipt', (receipt) => {
        console.log('receipt received');
      });
      promi.on('transactionHash', (txHash) => {
        console.log('txHash = ' + txHash);
        c.expect(txHash).to.have.string('0x');
      });
      promi.on('confirmation', (confNo, receipt) => {
        console.log('confirm number ' + confNo + ' received');
        c.expect(confNo).to.be.greaterThan(-1);
      });

      return promi;
    }).then((receipt) => {
      const log = receipt.logs[receipt.logs.length-1];

      c.expect(receipt).to.contain.keys(['gas','nonce','transactionIndex','transactionHash','to','status',
        'logsBloom','logs','gasUsed','from','cumulativeGasUsed','contractAddress','blockNumber','blockHash']);
  
      c.expect(log).to.contain.keys(['transactionIndex','transactionHash',
        'topics','removed','logIndex','data','blockNumber','blockHash','address']);
      
      return eth.call(contract, 'balanceOf', TEST_ACCOUNT);

    }).then((resp) => {
        const testAcctBalanceAfter = resp.balance;
        c.expect(parseInt(testAcctBalance) + 1).to.be.equal(parseInt(testAcctBalanceAfter));

        console.log('address '+TEST_ACCOUNT+' cogs increase from '+testAcctBalance+ ' to '+testAcctBalanceAfter);

        done();
    }).catch((err) => {
      console.error(err);
      throw new Error(err);
    });

  }).timeout(10 * 60 * 1000);

  m.it('should get past transfer for PERSONAL_ACCOUNT for past 100000 blocks', async function () {
    const blockNo = await eth.getBlockNumber();
    c.expect(blockNo).to.be.greaterThan(100000);

    const pastEvents = await eth.pastEvents(contract,'Transfer',
      {fromBlock:blockNo - 1000000,toBlock:'latest', filter:{from:PERSONAL_ACCOUNT}});

    
    c.expect(pastEvents.length).to.be.greaterThan(0);

    c.expect(pastEvents[0]).to.contain.keys(['raw','signature','event',
            'id','blockNumber','blockHash','address','logIndex','removed','returnValues']);

    c.expect(pastEvents[0].returnValues).to.contain.keys(['from','to','value']);


  }).timeout(10 * 60 * 1000);
})
