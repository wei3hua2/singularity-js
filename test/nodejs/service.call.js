const c = require('chai');
const m = require('mocha');
const {Config} = require('../config/config');
const {ServiceSvc, ChannelSvc, AccountSvc} = require('../../dist/impls');
const {RUN_JOB_STATE} = require('../../dist/models/options');

let config, log;
m.before(async() => {
    config = await Config.init();
    log = config.log;
});
m.after( async () => {
  config.teardown();
});

m.describe('service-call', () => {

  m.it('should get service channels for services', async () => {
    let svc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');
    let channels = await svc.getChannels({init: true});

    c.expect(channels.length).to.be.greaterThan(0);

    svc = await ServiceSvc.init(config.acct1, 'snet', 'style-transfer');
    channels = await svc.getChannels();
    c.expect(channels.length).to.be.greaterThan(-1);

    try{
      const svc = await ServiceSvc.init(config.acct1, 'snet', 'not-found-service');
    }catch(err){
      c.expect(err.code).to.be.equal('sv_registry_id_not_found');
      c.expect(err.params).to.be.deep.equal(['snet','not-found-service']);
    }
  });

  m.it('should retrieve service info', async function() {
    const svc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');

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

  m.it('should ping example service daemon for heartbeat', async function () {
    const exampleSvc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');
    const heartbeat = await exampleSvc.pingDaemonHeartbeat();

    c.expect(heartbeat).have.all.keys(['daemonID','timestamp','status','serviceheartbeat']);
    c.expect(heartbeat.status).to.be.equal('Online');
    c.expect(heartbeat.timestamp).to.be.greaterThan(0);
    c.expect(heartbeat.timestamp).to.be.lessThan(new Date().getTime());

  });

  m.it('should get the encoding from example service daemon', async function () {
    const exampleSvc = await ServiceSvc.init(config.acct1, 'snet', 'example-service');
    const encoding = await exampleSvc.getDaemonEncoding();

    c.expect(encoding).that.be.equal('proto\n');
  });

})
