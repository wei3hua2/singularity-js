import * as c from 'chai';
import * as m from 'mocha';

import * as snet from '../../src/snet';

let $CONTEXT;

m.beforeEach(() => {
})

m.describe('ClazzDefinition', () => {
  m.it('should ensure class and modules are defined', async function() {
    c.expect(snet.Eth).to.exist;
    c.expect(snet.Mpe).to.exist;
    c.expect(snet.Tokens).to.exist;
    c.expect(snet.Accounts).to.exist;
    c.expect(snet.Organizations).to.exist;
    c.expect(snet.Channels).to.exist;
    c.expect(snet.Client).to.exist;
    c.expect(snet.Identity).to.exist;
    c.expect(snet.Marketplace).to.exist;
    c.expect(snet.Services).to.exist;
  });

  m.xit('should instantiate with proper fields', async function () {
    // create, utils
    // const snetInstance = create('web3instance');
    // console.log(snetInstance);
  });
})
