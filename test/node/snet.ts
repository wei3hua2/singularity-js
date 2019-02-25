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

  m.it('should retrieve information for organizations and services', async function () {
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

    const svcTypes = await exampleSvc.listTypes();
    c.expect(svcTypes['Result']).to.exist;
    c.expect(svcTypes['Numbers']).to.exist;

    const svcInfo = await exampleSvc.serviceInfo();
    c.expect(svcInfo).to.be.deep.equal(EXAMPLESVC_SERVICE_INFO);

    const svcInfoVerbose = await exampleSvc.serviceInfo({pbField:true});
    // console.log(svcInfoVerbose['methods']['add']['request']['fields']);
    
  }).timeout(30000);

  m.it('should run addition job from snet, example-service', async function () {
    const snet = await Snet.init(web3, {address:PERSONAL_ACCOUNT, privateKey:PERSONAL_PRIVATE_KEY});
    const svc = await snet.getService('snet','example-service');
    
    const addRequest = await svc.defaultRequest('add');
    console.log(addRequest);

    // const info = await svc.serviceInfo();
    // console.log(JSON.stringify(info, null, 1));
  });
})
