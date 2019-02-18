import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {Eth} from '../../src/eth';
import {Services} from '../../src/services';

let web3, eth, svc;

// m.before(() => {
//     web3 = initWeb3();
//     eth = new Eth(web3);
//     svc = new Services(eth);
// });
// m.after(() => {
//     eth.close();
// });

m.describe.skip('Services', () => {
  m.it('should create get proto file url', async function() {
    const id = await eth.getNetworkId();
    const orgId = 'snet', svcId = 'example-service';

    const protoFile = await svc.getServiceProtoFile(orgId, svcId);
    // console.log(JSON.stringify(protoFile));
    
    c.expect(protoFile[0].nested).to.exist;
    c.expect(protoFile[0].nested['example_service']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Numbers']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Result']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Calculator']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Calculator']['methods']['add']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Calculator']['methods']['sub']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Calculator']['methods']['mul']).to.exist;
    c.expect(protoFile[0].nested['example_service']['nested']['Calculator']['methods']['div']).to.exist;

    const rootNamespace = await svc.getProto(orgId, svcId);

    c.expect(rootNamespace).to.have.all.keys(['Type','Service']);
    
  });
})
