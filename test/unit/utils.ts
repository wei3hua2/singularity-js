import * as c from 'chai';
import * as m from 'mocha';

import * as utils from '../../src/utils';


m.describe('Utils', () => {
  m.it('should convert Agi and Cogs Properly', async function() {
      const AGI_COIN = 100;
      const COGS_COIN = 10000000000;

      c.expect(utils.cogsToAgi(COGS_COIN)).to.be.equals(AGI_COIN);
      c.expect(utils.agiToCogs(AGI_COIN)).to.be.equals(COGS_COIN);
  });
})