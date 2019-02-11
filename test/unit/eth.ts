import * as c from 'chai';
import * as m from 'mocha';
import * as bb from 'bluebird';

import {Eth} from '../../src/eth';


let ethInstance;
const MOCK_WEB3 = {
    eth: {
        getBlockNumber: () => (new bb.Promise((resolve) => resolve(120)))
    }
}

m.beforeEach(() => {
    ethInstance = new Eth(MOCK_WEB3);
})

m.describe('Eth', () => {
  m.it('should get block number', async function() {
      const blockNumber = await ethInstance.getBlockNumber();
      c.expect(blockNumber).to.be.equal(120);
  });
})