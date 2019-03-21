const c = require('chai');
const m = require('mocha');
const {initWeb3, getConfigInfo} = require('./utils');
const {EthUtil} = require('../../dist/utils/eth');


const AGITokenNetworks = require('singularitynet-token-contracts/networks/SingularityNetToken.json');
const AGITokenAbi = require('singularitynet-token-contracts/abi/SingularityNetToken.json');

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

m.describe('Eth', () => {

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
