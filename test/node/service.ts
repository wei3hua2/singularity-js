import * as c from 'chai';
import * as m from 'mocha';
import {initWeb3} from './utils';
import {Service} from '../../src/service';

let web3;

// m.before(() => {
//     web3 = initWeb3();
// });
// m.after(() => {
//   web3.currentProvider.connection.close();
// });

m.describe('Service', () => {
  m.it('should list available methods', async function() {
    const svc = await Service.init(web3, 'snet', 'example-service');
    const methods = await svc.listMethods();

    console.log(methods);
  });

  // m.it('should')
})
