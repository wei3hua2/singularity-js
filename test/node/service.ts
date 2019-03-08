import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {ServiceSvc} from '../../src/impls/service';
import {RUN_JOB_STATE} from '../../src/models/options';
import {AccountSvc} from '../../src/impls/account';
import {getConfigInfo} from './utils';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(async() => {
    web3 = initWeb3();

    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];

    account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
});
m.after(async () => {
  web3.currentProvider.connection.close();
});

m.describe.only('ServiceSvc', () => {

  m.xit('should get service channels for services', async () => {
    let svc = await ServiceSvc.init(account, 'snet', 'example-service');
    let channels = await svc.getChannels();
    c.expect(channels.length).to.be.greaterThan(0);

    svc = await ServiceSvc.init(account, 'snet', 'style-transfer');
    channels = await svc.getChannels();
    c.expect(channels.length).to.be.equal(0);

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

  m.it('should run the job', function (done) {

    const svc = ServiceSvc.init(account, 'snet', 'example-service');

    svc.then((svc) => {
      const request = svc.defaultRequest('add');
      c.expect(Object.keys(request)).to.be.deep.equal(['a','b']);

      request.a = 5, request.b = 6;
  
      const job = svc.runJob('add', request, {autohandle_channel: true, channel_min_expiration: 10000});

      job.on(RUN_JOB_STATE.available_channels,(channels) => {
        console.log('*** available_channels *** ');
        c.expect(channels.length).to.be.greaterThan(0);
      });
      job.on(RUN_JOB_STATE.create_new_channel,(channel) => {
        console.log('*** create_new_channel *** ');
        c.expect(channel).to.exist;
      });
      job.on(RUN_JOB_STATE.channel_extend_and_add_funds,(channel) => {
        console.log('*** channel_extend_and_add_funds ***');
      });
      job.on(RUN_JOB_STATE.channel_add_funds,(channel) => {
        console.log('*** channel_add_funds ***');
      });
      job.on(RUN_JOB_STATE.channel_extend_expiration,(channel) => {
        console.log('*** channel_extend_expiration ***');
      });
      job.on(RUN_JOB_STATE.selected_channel,(channel) => {
        console.log('*** selected_channel ***');
        c.expect(channel).to.exist;
        console.log(JSON.stringify(channel));
      });
      job.on(RUN_JOB_STATE.sign_channel_state,(channelStateRqt) => {
        console.log('*** sign_channel_state ***');
        c.expect(channelStateRqt).to.have.all.keys(['channelId', 'signature']);
      });
      job.on(RUN_JOB_STATE.channel_state,(channelState) => {
        console.log('*** channel_state ***');
        c.expect(channelState).to.have.all.keys(['channelId','endpoint','url',
          'currentSignature','currentNonce','currentSignedAmount']);
        console.log(JSON.stringify(channelState));
      });
      job.on(RUN_JOB_STATE.sign_request_header,(reqHeader) => {
        console.log('*** sign_request_header *** ');
        c.expect(reqHeader).to.have.all.keys(['channelId','nonce','price_in_cogs']);
        console.log(JSON.stringify(reqHeader));
      });
      job.on(RUN_JOB_STATE.request_info,(request) => {
        console.log('*** request_info ***');
        c.expect(request).to.be.deep.equal({a:5,b:6});
      });

      return job;
    }).then((response) => {
      c.expect(response.value).to.be.equals(11);
      done();
    }).catch(err => {
      console.log('ERROR FOUND : ');
      done(err);
    })

    
  }).timeout(10 * 60 * 1000);
})
