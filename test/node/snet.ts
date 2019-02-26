import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3, getConfigInfo} from './utils';
import {Snet} from '../../src/snet';
import { Organization } from '../../src/organization';

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
            "optional": true
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true
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
            "optional": true
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true
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
            "optional": true
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true
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
            "optional": true
          },
          "b": {
            "type": "float",
            "required": false,
            "optional": true
          }
        }
      },
      "response": {
        "name": "Result",
        "fields": {
          "value": {
            "type": "float",
            "required": false,
            "optional": true
          }
        }
      }
    }
  }
}



m.describe.only('Snet', () => {
  m.it('should initialize with appropriate objects without error', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});

    c.expect(snet.getCurrentAccount()).to.exist;
    c.expect(snet.getCurrentAccount().address).to.be.equal(PERSONAL_ACCOUNT);
  });

  m.xit('should retrieve information for organizations and services', async function () {
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


    const snetOrg = await snet.getOrganization('snet');

    c.expect(snetOrg.isInit).to.be.true;
    c.expect(snetOrg.id).to.be.equal('snet');
    c.expect(snetOrg.name).to.be.equal('snet');


    // services

    const snetSvcs = await snetOrg.getServices();
    let snetSvc = snetSvcs[0];
    c.expect(orgs.length).to.be.greaterThan(0);

    c.expect(snetSvc.serviceId).to.exist;
    c.expect(snetSvc.organizationId).to.be.equal('snet');
    c.expect(snetSvc.isInit).to.be.false;
    
    // service
    
    const exampleSvc = await snet.getService('snet', 'example-service');
    
    c.expect(exampleSvc.serviceId).to.be.equal('example-service');
    c.expect(exampleSvc.organizationId).to.be.equal('snet');
    c.expect(exampleSvc.isInit).to.be.true;
    c.expect(exampleSvc.tags).to.exist;
    c.expect(exampleSvc.metadata).to.exist;
    c.expect(exampleSvc.ServiceProto).to.exist;

    const svcMethods = await exampleSvc.listMethods();
    c.expect(svcMethods).to.have.keys(['add','sub','mul','div']);

    const svcTypes = exampleSvc.listTypes();
    c.expect(svcTypes['Result']).to.exist;
    c.expect(svcTypes['Numbers']).to.exist;

    const svcInfo = await exampleSvc.serviceInfo();
    c.expect(svcInfo).to.be.deep.equal(EXAMPLESVC_SERVICE_INFO);

    const svcInfoVerbose = await exampleSvc.serviceInfo({pbField:true});
    // console.log(svcInfoVerbose['methods']['add']['request']['fields']);
    
  }).timeout(30000);

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

  m.xit('FOR INFO PURPOSE ONLY', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const result = {};

    const orgs = await snet.listOrganizations({init:false});

    for(var i=0;i<orgs.length;i++) {
      const org = orgs[i];
      result[org.id] = [];
      const svcs = await org.getServices({init:true});
      
      for(var j=0;j<svcs.length;j++) {
        const info = await svcs[j].serviceInfo();
        result[org.id].push(info);
      }
    }

    var fs = require('fs');
    console.log(result);
    fs.writeFileSync('services.json', JSON.stringify(result,null,3));
    
  }).timeout(50000);
})
