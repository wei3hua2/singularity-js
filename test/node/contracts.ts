import * as c from 'chai';
import * as m from 'mocha';

import {Snet} from '../../src/snet';

import {initWeb3, getConfigInfo} from './utils';


let PERSONAL_ACCOUNT, web3, PERSONAL_PRIVATE_KEY, TEST_ACCOUNT, TEST_ACCOUNT_PRIVATE_KEY, snet;

// m.before(async () => {
//   web3 = initWeb3();
//   snet = await Snet.init(web3);
//   PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
//   TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
//   PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
//   TEST_ACCOUNT_PRIVATE_KEY = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];
// });
// m.after(() => {
//   web3.currentProvider.connection.close();
// })

m.describe.skip('Contract', () => {
  m.xit('should work for Tokens call functions', async function() {
    const tokens = snet.contracts.tokens;

    const name = await tokens.name();
    const totalSupply = await tokens.totalSupply();
    const INITIAL_SUPPLY = await tokens.INITIAL_SUPPLY();
    const decimals = await tokens.decimals();
    const paused = await tokens.paused();
    const owner = await tokens.owner();
    const symbol = await tokens.symbol();
    const balanceOf = await tokens.balanceOf(PERSONAL_ACCOUNT);
    const allowance = await tokens.allowance(PERSONAL_ACCOUNT, PERSONAL_ACCOUNT);

    c.expect(name).to.equal('SingularityNET Token');
    c.expect(totalSupply).to.equal('100000000000000000');
    c.expect(INITIAL_SUPPLY).to.equal('100000000000000000');
    c.expect(decimals).to.equal('8');
    c.expect(paused).to.be.false;
    c.expect(owner).to.have.string('0x');
    c.expect(symbol).to.equal('AGI');
    c.expect(balanceOf).to.exist;
    c.expect(allowance).to.exist;

    console.log('Tokens call result :');
    console.log('   '+[name, totalSupply, INITIAL_SUPPLY, decimals, paused, owner, symbol, balanceOf, allowance]);
  });

  m.xit('should work for MultiPartyEscrow call functions', async function () {
    const mpe = snet.contracts.mpe;

    const balances = await mpe.balances(PERSONAL_ACCOUNT);
    const channels = await mpe.channels(1);
    const nextChannelId = await mpe.nextChannelId();
    const token = await mpe.token();

    c.expect(balances).to.exist;
    c.expect(channels).to.exist;
    c.expect(nextChannelId).to.exist;
    c.expect(token).to.have.string('0x');

    console.log('MultiParty Escrow call result :');
    console.log('   '+[balances, channels, nextChannelId, token]);
  });

  m.xit('should work for Registry call functions', async function () {
    const registry = snet.contracts.registry;

    const listOrganizations = await registry.listOrganizations();
    const getOrganizationById = await registry.getOrganizationById('jameschong');
    const listServicesForOrganization = await registry.listServicesForOrganization('jameschong');
    const getServiceRegistrationById = await registry.getServiceRegistrationById('jameschong', 'example-service');
    const listServiceTags = await registry.listServiceTags();
    const listServicesForTag = await registry.listServicesForTag('Recognition');

    // const listTypeRepositoriesForOrganization = await registry.listTypeRepositoriesForOrganization('snet');
    // const getTypeRepositoryById = await registry.getTypeRepositoryById('snet', 'repoId'); //TODO
    // const listTypeRepositoryTags = await registry.listTypeRepositoryTags();  //TODO
    // const listTypeRepositoriesForTag = await registry.listTypeRepositoriesForTag('Recognition'); //TODO
    // const supportsInterface = await registry.supportsInterface('interfaceId');  //TODO

    c.expect(listOrganizations).to.contain.keys([0]);
    c.expect(getOrganizationById).to.contain.keys(['found','id','name','owner','members','serviceIds']);
    c.expect(listServicesForOrganization).to.contain.keys(['found','serviceIds']);
    c.expect(getServiceRegistrationById).to.contain.keys(['found','id','metadataURI','tags']);
    c.expect(listServiceTags).to.contain.keys([0]);
    c.expect(listServicesForTag).to.contain.keys(['orgIds','serviceIds']);

    console.log('Registry call result :');
    console.log('   '
      +[listOrganizations, getOrganizationById, listServicesForOrganization, getServiceRegistrationById, 
        listServiceTags, listServicesForTag]);
  });


  m.xit('should perform transaction for Tokens functions', async function () {
    const tokens = snet.contracts.tokens;
    const TRANSFER_VALUE = 1;

    const balanceOf = await tokens.balanceOf(PERSONAL_ACCOUNT);
    const balanceOfTestAcct = await tokens.balanceOf(TEST_ACCOUNT);
    console.log(balanceOf);
    console.log(balanceOfTestAcct);

    const receipt = await tokens.transfer(TEST_ACCOUNT, TRANSFER_VALUE, {
      signTx: true,
      from: PERSONAL_ACCOUNT, fromPrivateKey: PERSONAL_PRIVATE_KEY
    });
    console.log(receipt);

    c.expect(receipt.status).to.be.true;
    c.expect(receipt).to.contain.keys(['status','blockHash','blockNumber',
      'transactionHash','transactionIndex']);
    

  }).timeout(30000);


// [ 'yolov3-object-detection','example-service','cntk-image-recon','i3d-video-action-recognition',
    //  'translation','semantic-similarity-binary','network-analytics-robustness','cntk-next-day-trend','cntk-lstm-forecast',
    //  'brand-mgmt-service-consumer','example-image-conversion-service','cntk-language-understanding','zeta36-chess-alpha-zero',
    //  'opennmt-romance-translator','s2vt-video-captioning','news-summary','semantic-segmentation','face-identity',
    //  'face-detect','face-landmarks','face-align','sentiment-analysis','emotion-recognition-service',
    //  'named-entity-recognition','network-analytics-bipartite','holistic-edge-detection-service','dev-TSAD',
    //  'moses-service','annotation-service','super-resolution','opencog-vqa','speech-recognition','speech-synthesis',
    //  'question-answering-long-seq','question-answering-short-seq','time-series-anomaly-discovery' ];

  m.it('FOR TEMP TESTING ONLY', async function () {
    
    const registry = snet.contracts.registry;

    // const tmp = await registry.listOrganizations();
    // const tmp = await registry.getOrganizationById('snet');
    // const tmp = await registry.listServicesForOrganization('jameschong');
    // const tmp = await registry.getServiceRegistrationById('snet', 'example-service');
    // const tmp = await registry.listServiceTags();
    // const tmp = await registry.listServicesForTag('Recognition');

    // console.log(tmp)
  });
})
