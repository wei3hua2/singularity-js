const c = require('chai');
const m = require('mocha');
const {Config} = require('../config/config');
const {EthUtil} = require('../../dist/utils/eth');
const {ERROR_CODES} = require('../../dist/errors');

const AGITokenNetworks = require('singularitynet-token-contracts/networks/SingularityNetToken.json');
const AGITokenAbi = require('singularitynet-token-contracts/abi/SingularityNetToken.json');

let eth, contract, CHAINID;
let config;

m.before(async () => {
    config = await Config.init();
    web3 = config.web3;
    eth = new EthUtil(config.web3);

    CHAINID = config.CHAINID;
    contract = eth.getContract(AGITokenAbi, AGITokenNetworks[CHAINID].address);
});
m.after(() => {
    eth.close();
})

m.describe('eth-call', () => {

  m.it('should ensure basic information is valid', async function() {
    const version = eth.getWeb3Version();
    const netId = await eth.getNetworkId();
    const blockNo = await eth.getBlockNumber();

    config.log('version  : ' + version);
    config.log('netId    : ' + netId);
    config.log('blockNo  : ' + blockNo);

    c.expect(version).to.have.string('1.0.0');
    c.expect(netId).to.equal(3);
    c.expect(blockNo).to.be.greaterThan(1000000);

    try {
      const account = await eth.getAccount();
    }catch(err) {
      c.expect(err.name).to.be.equal('SnetError');
      c.expect(err.code).to.be.equal(ERROR_CODES.eth_account_error);
    }
  });

  m.it('should call token contract to get available tokens', async function () {
    const symbol = await eth.call(contract, 'symbol');
    c.expect(symbol).to.be.equal('AGI');

    const balance = (await eth.call(contract, 'balanceOf', config.PERSONAL_ACCOUNT)).balance;
    c.expect(parseInt(balance)).to.be.greaterThan(0);

    const balanceTest = (await eth.call(contract, 'balanceOf', config.TEST_ACCOUNT)).balance;
    c.expect(parseInt(balance)).to.be.greaterThan(0);

    config.log('Address : '+config.TEST_ACCOUNT);
    config.log('Symbol : '+symbol);
    config.log('Balance (Personal): '+balance);
    config.log('Balance (Test): '+balanceTest);
  });


  m.it('should get past transfer for PERSONAL_ACCOUNT for past 100000 blocks', async function () {
    const blockNo = await eth.getBlockNumber();
    c.expect(blockNo).to.be.greaterThan(100000);

    const pastEvents = await eth.pastEvents(contract,'Transfer',
      {fromBlock:blockNo - 1000000,toBlock:'latest', filter:{from:config.PERSONAL_ACCOUNT}});

    
    c.expect(pastEvents.length).to.be.greaterThan(0);

    c.expect(pastEvents[0]).to.contain.keys(['raw','signature','event',
            'id','blockNumber','blockHash','address','logIndex','removed','returnValues']);

    c.expect(pastEvents[0].returnValues).to.contain.keys(['from','to','value']);


  }).timeout(10 * 60 * 1000);
})
