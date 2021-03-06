const c = require('chai');
const m = require('mocha');
const {Config} = require('../config/config');
const {ServiceSvc, ChannelSvc, AccountSvc} = require('../../dist/impls');
const {RUN_JOB_STATE} = require('../../dist/models/options');

let config;
m.before(async() => {
    config = await Config.init();
});
m.after( async () => {
  config.teardown();
});

m.describe('service-state', () => {

  m.it('should run simple example-service job', async function () {
    const svc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');

    // const balance = await account.getEscrowBalances({inCogs:true});
    // config.log((balance);
    // config.log((await account.withdrawFromEscrow(balance, {inCogs:true}));
    // config.log((await account.getEscrowBalances({inCogs:true}));


    const channel = await ChannelSvc.retrieve(config.acct1, 1218);
    // config.log((channel.data);

    const job = svc.runJob('add', {a:5, b:6}, channel, {channel_min_amount: 40})
      .on('debug_update_options', d =>{ config.log(' - debug_update_options'); config.log(d); });

    job.on('all_events', (evts) => {
      log.info(' === '+evts[0]+' ===');
      const result = evts[1];
      if(result['request_channel_state']) result['request_channel_state'].signature = "* EXCLUDED *";
      // if(evts[0] === 'request_svc_call') log.info(result);
    });
    
    job.on('stats', config.log);

    const result = await job;
    c.expect(result.value).to.be.equals(11);

  }).timeout(10 * 60 * 1000);


})
