import * as c from 'chai';
import * as m from 'mocha';

import * as snet from '../src/snet';
import {create} from '../src/snet';

let $CONTEXT;

m.beforeEach(() => {
  console.log('before Each started : ')
})

m.describe('Index', () => {
  m.it('should be whatever', async function() {
    const snetInstance = create('web3instance');
    console.log(snetInstance);
  });

  m.it('should be whatever action', async function () {
    // console.log(snet.eth);
  });

})
