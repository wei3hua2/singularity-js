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

m.describe.only('service-state', () => {

  m.it('should run example-service add job 5 + 8 = 13 with min params', async function () {
    const svc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');

    const reply = svc.runJob('add', {a:5, b:8});

    reply.on('all_events', (evts) => {
      if(evts[0] === 'reply_svc_call')
        EXAMPLE_SERVICE_ALL_EVENTS_REPLY_SVC_CALL(evts[1]);
    });

    reply.on('reply_svc_call', (result) => {
      c.expect(result.value).to.be.equal(13);
    });

    reply.on('stats', (stats) => {
      c.expect(stats).that.have.all.keys(['txs', 'time_taken','total_tx','total_gas','channel_id',
      'channel_nonce','channel_signed_amount','request','response','escrow','agi','channel_value']);
    })

    const result = await reply;
    
    c.expect(result.value).to.be.equal(13);
  });
})


const EXAMPLE_SERVICE_ALL_EVENTS_REPLY_SVC_CALL = function (allEvts) {

  c.expect(allEvts).to.have.all.keys(['request_available_channels','reply_available_channels',
  'request_new_channel','reply_new_channel', 'resolved_channel','request_channel_state', 'reply_channel_state',
  'checked_channel_validity', 'request_channel_extend_and_add_funds', 'reply_channel_extend_and_add_funds',
  'request_channel_add_funds', 'reply_channel_add_funds', 'request_channel_extend_expiration', 'reply_channel_extend_expiration',
  'request_svc_call','reply_svc_call']);

  c.expect(allEvts.request_available_channels).to.be.true;
  c.expect(allEvts.reply_available_channels.length).to.be.greaterThan(0);
  c.expect(allEvts.request_new_channel).to.be.null;
  c.expect(allEvts.reply_new_channel).to.be.null;
  c.expect(allEvts.resolved_channel).to.have.all.keys(['id', 'sender','signer','recipient','groupId','value','expiration','endpoint']);
  c.expect(allEvts.request_channel_state).to.have.all.keys(['channelId', 'signature']);
  c.expect(allEvts.reply_channel_state).to.have.all.keys(['channelId', 'endpoint','currentSignedAmount']);
  c.expect(allEvts.checked_channel_validity).to.have.all.keys(['options', 'validity']);
  c.expect(allEvts.request_channel_extend_and_add_funds).to.be.null;
  c.expect(allEvts.reply_channel_extend_and_add_funds).to.be.null;
  c.expect(allEvts.request_channel_add_funds).to.be.null;
  c.expect(allEvts.reply_channel_add_funds).to.be.null;
  c.expect(allEvts.request_channel_extend_expiration).to.be.null;
  c.expect(allEvts.reply_channel_extend_expiration).to.be.null;
  
  c.expect(allEvts.request_svc_call).to.have.all.keys(['header','body']);
  c.expect(allEvts.reply_svc_call.value).to.be.equal(13);

}