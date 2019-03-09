import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Snet} from '../../src/snet';
import {RUN_JOB_STATE} from '../../src/models/options';
import fs from 'fs';

let web3, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

m.before(() => {
    web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];
});
m.after(() => {
    web3.currentProvider.connection.close();
})

const EXAMPLESVC_SERVICE_INFO = {
  "name": "Calculator",
  "methods": {
    "add": {
      "request": {
        "name": "Numbers",
        "fields": {
          "a": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      }
    },
    "sub": {
      "request": {
        "name": "Numbers",
        "fields": {
          "a": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      }
    },
    "mul": {
      "request": {
        "name": "Numbers",
        "fields": {
          "a": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      }
    },
    "div": {
      "request": {
        "name": "Numbers",
        "fields": {
          "a": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true,
            "value": 0
          }
        }
      }
    }
  }
}



m.describe.only('Snet', () => {
  m.xit('should initialize with appropriate objects without error', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

    c.expect(snet.getCurrentAccount()).to.exist;
    c.expect(snet.getCurrentAccount().address).to.be.equal(PERSONAL_ACCOUNT);
  });

  m.xit('should list organization', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    // organizations

    let orgs = await snet.listOrganizations();
    let org = orgs[0];

    c.expect(orgs.length).to.be.greaterThan(0);
    c.expect(org.isInit).to.be.false;
    c.expect(org.id).to.exist;
    c.expect(org.name).to.undefined;

    orgs = await snet.listOrganizations({init:true});
    org = orgs[0];

    c.expect(orgs.length).to.be.greaterThan(0);
    c.expect(org.isInit).to.be.true;
    c.expect(org.id).to.exist;
    c.expect(org.name).to.exist;
  });

  m.xit('should get organization', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const snetOrg = await snet.getOrganization('snet');

    c.expect(snetOrg.isInit).to.be.true;
    c.expect(snetOrg.id).to.be.equal('snet');
    c.expect(snetOrg.name).to.be.equal('snet');

    const snetSvcs = await snetOrg.getServices();

    let snetSvc = snetSvcs[0];
    c.expect(snetSvcs.length).to.be.greaterThan(0);

    c.expect(snetSvc.id).to.exist;
    c.expect(snetSvc.organizationId).to.be.equal('snet');
    c.expect(snetSvc.isInit).to.be.false;
  });


  m.xit('should get service', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

    
    const exampleSvc = await snet.getService('snet', 'example-service');
    
    c.expect(exampleSvc.id).to.be.equal('example-service');
    c.expect(exampleSvc.organizationId).to.be.equal('snet');
    c.expect(exampleSvc.isInit).to.be.true;
    c.expect(exampleSvc.tags).to.exist;
    c.expect(exampleSvc.metadata).to.exist;
    c.expect(exampleSvc.ServiceProto).to.exist;


    const svcInfo = await exampleSvc.info();
    c.expect(svcInfo).to.be.deep.equal(EXAMPLESVC_SERVICE_INFO);
    
  });

  m.xit('should open channel', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const svc = await snet.getService('snet', 'named-entity-disambiguation');
    
    const channel = await svc.openChannel(null, 1, 1000);
    console.log(channel);

    c.expect(channel.id).to.exist;

  }).timeout(10 * 60 * 1000);

  m.xit('should able to retrieve all services detail', async function() {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const svcs = await (await snet.getOrganization('snet')).getServices({init:true});
    // console.log(svcs.map(s => s.data['id']));

    for(var i in svcs) {
      const svc = svcs[i];
      
      console.log("******" + svc.data['id'] + "******");
      console.log(Object.keys(svc.info().methods));

      Object.keys(svc.info().methods).forEach(method => {
        
        console.log(svc.defaultRequest(method));
      });
      console.log();
    }
  });

  m.xit('FOR INFO PURPOSE ONLY: try out individual service', function (done) {
    const snetP = Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

    // snetP.then(snet => snet.getService('snet', 'speech-synthesis'))
    //   .then(svc => {
    //     const job = svc.runJob('t2s', {text: 'hello world from my world'}, {channel_min_expiration: 10000});
    //     listAllEvents(job);
    //     job.then(v => { fs.writeFileSync('temp.wav',v.data); done(); });
    //     job.catch(done);
    //   });

    snetP.then(snet => snet.getService('snet', 'named-entity-disambiguation'))
      .then(svc => {
        console.log(svc.info());
        console.log(svc.info().methods['named_entity_disambiguation'].request);
        const request = svc.defaultRequest('named_entity_disambiguation');
        request.value ="hello to the world";
        
        const job = svc.runJob('Show', request);
        listAllEvents(job);
        job.then(v => { console.log(v); done(); });
        job.catch(done);
      });
    
  }).timeout(10 * 60 * 1000);

  m.xit('should run addition job from snet, example-service', function (done) {
    let service;

    Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY})
    .then((snet) => snet.getService('snet','example-service'))
    .then((svc) => {
      service = svc;
      const addRequest = svc.defaultRequest('add');

      c.expect(addRequest).to.have.keys(['a','b']);

      addRequest['a'] = 3, addRequest['b'] = 4;

      console.log('addRequest : '+JSON.stringify(addRequest));

      return addRequest;

    }).then((req) => {
      const job = service.runJob('add', req);

      job.on('signed_header', console.log);
      job.on('selected_channel', console.log);
      job.then((response) => {console.log(response); done();});
      job.catch((err) => {console.error(err); done(err);});

    }).catch((err) => {
      console.error(err);
      done(err);
    })
  });

  m.xit('FOR INFO PURPOSE ONLY: all services info', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const result = {};

    const orgs = await snet.listOrganizations({init:false});

    for(var i=0;i<orgs.length;i++) {
      const org = orgs[i];
      result[org.id] = [];
      const svcs = await org.getServices({init:true});
      
      for(var j=0;j<svcs.length;j++) {
        const info = await svcs[j].info();
        result[org.id].push(info);
      }
    }

    var fs = require('fs');
    console.log(result);
    fs.writeFileSync('services.json', JSON.stringify(result,null,3));
    
  }).timeout(50000);
})

function listAllEvents(promiEvent) {
  for(var state in RUN_JOB_STATE){
    const s = state.slice(0);
    promiEvent.on(s, (evt) => {
      console.log('*** '+s+' ***');

      if(s === RUN_JOB_STATE.sign_channel_state)
        console.log(Object.keys(evt));
      else
        console.log(evt);
    });
  }
}