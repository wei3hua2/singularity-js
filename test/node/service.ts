import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {ServiceSvc} from '../../src/impls/service';
import {ChannelSvc} from '../../src/impls/channel';
import {RUN_JOB_STATE} from '../../src/models/options';
import {AccountSvc} from '../../src/impls/account';
import {getConfigInfo} from './utils';
import {Logger} from '../../src/utils/logger';


Logger.setLogLevel(2);

let web3, account, testAccount, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY, TEST_ACCOUNT, TEST_ACCOUNT_PK;
const log = Logger.logger();

m.before(async() => {
    web3 = initWeb3();

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
    TEST_ACCOUNT = getConfigInfo()['TEST_ACCOUNT'];
    TEST_ACCOUNT_PK = getConfigInfo()['TEST_ACCOUNT_PRIVATE_KEY'];

    account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
    testAccount = await AccountSvc.create(web3, {address: TEST_ACCOUNT, privateKey: TEST_ACCOUNT_PK});
});
m.after( async () => {
  web3.currentProvider.connection.close();
});

m.describe('ServiceSvc', () => {

  m.xit('should get service channels for services', async () => {
    let svc = await ServiceSvc.init(account, 'snet', 'example-service');
    let channels = await svc.getChannels({init: true});

    c.expect(channels.length).to.be.greaterThan(0);

    svc = await ServiceSvc.init(account, 'snet', 'style-transfer');
    channels = await svc.getChannels();
    c.expect(channels.length).to.be.greaterThan(-1);

    try{
      const svc = await ServiceSvc.init(account, 'snet', 'not-found-service');
    }catch(err){
      c.expect(err.code).to.be.equal('sv_registry_id_not_found');
      c.expect(err.params).to.be.deep.equal(['snet','not-found-service']);
    }
  });

  m.xit('should retrieve service info', async function() {
    const svc = await ServiceSvc.init(account, 'snet', 'example-service');

    const info = await svc.info();
    const name = info.name;
    const methods = info.methods;

    c.expect(name).to.be.equal('Calculator');
    c.expect(methods).to.have.all.keys(['add','sub','mul','div']);

    const addRequest = methods.add.request;
    const addResponse = methods.add.response;

    c.expect(addRequest.name).to.be.equal('Numbers');

    c.expect(addRequest.fields.a).to.be.deep.equal({ type: 'float', required: false, optional: true, value: 0 });
    c.expect(addRequest.fields.b).to.be.deep.equal({ type: 'float', required: false, optional: true, value: 0 });

    c.expect(addResponse.name).to.be.equal('Result');

    c.expect(addResponse.fields.value).to.be.deep.equal({ type: 'float', required: false, optional: true, value: 0 });

    const request = svc.defaultRequest('add');
    c.expect(request).to.be.deep.equal({a:0, b:0});

    const svcData = svc.data;
    c.expect(svcData['id']).to.be.equal('example-service');
    c.expect(svcData['organizationId']).to.be.equal('snet');
    c.expect(svcData['tags']).to.be.deep.equal(['Service','Example','Arithmetic']);

    c.expect(svcData['metadata']).to.be.contain.keys(['version', 'display_name', 'encoding','service_type',
        'payment_expiration_threshold', 'model_ipfs_hash', 'mpe_address', 'pricing', 'groups',
        'endpoints', 'service_description']);
  });

  m.xit('should ping example service daemon for heartbeat', async function () {
    const exampleSvc = await ServiceSvc.init(account, 'snet', 'example-service');
    const heartbeat = await exampleSvc.pingDaemonHeartbeat();

    c.expect(heartbeat).have.all.keys(['daemonID','timestamp','status','serviceheartbeat']);
    c.expect(heartbeat.status).to.be.equal('Online');
    c.expect(heartbeat.timestamp).to.be.greaterThan(0);
    c.expect(heartbeat.timestamp).to.be.lessThan(new Date().getTime());

  });

  m.xit('should get the encoding from example service daemon', async function () {
    const exampleSvc = await ServiceSvc.init(account, 'snet', 'example-service');
    const encoding = await exampleSvc.getDaemonEncoding();

    c.expect(encoding).that.be.equal('proto\n');
  });

  m.it('should run simple example-service job', async function () {
    const svc = await ServiceSvc.init(account, 'snet', 'example-service');

    // const balance = await account.getEscrowBalances({inCogs:true});
    // console.log(balance);
    // console.log(await account.withdrawFromEscrow(balance, {inCogs:true}));
    // console.log(await account.getEscrowBalances({inCogs:true}));


    const channel = await ChannelSvc.retrieve(account, 1218);
    // console.log(channel.data);

    const job = svc.runJob('add', {a:5, b:6}, channel, {channel_min_amount: 40})
      .on('debug_update_options', d =>{ console.log(' - debug_update_options'); console.log(d); });

    job.on('all_events', (evts) => {
      log.info(' === '+evts[0]+' ===');
      const result = evts[1];
      if(result['request_channel_state']) result['request_channel_state'].signature = "* EXCLUDED *";
      // if(evts[0] === 'request_svc_call') log.info(result);
    });
    
    job.on('stats', console.log);

    const result = await job;
    c.expect(result.value).to.be.equals(11);

  }).timeout(10 * 60 * 1000);


})
