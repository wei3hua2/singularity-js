import * as c from 'chai';
import * as m from 'mocha';
// import {initWeb3} from './utils';
import {getConfigInfo} from './utils';
import {Ipfs} from '../../src/utils/ipfs';

let web3, account, PERSONAL_ACCOUNT, PERSONAL_PRIVATE_KEY;

let log = function(s?){
  console.log(s);
}

m.before(async() => {
    // web3 = initWeb3();
    PERSONAL_ACCOUNT = getConfigInfo()['PERSONAL_ACCOUNT'];
    PERSONAL_PRIVATE_KEY = getConfigInfo()['PERSONAL_PRIVATE_KEY'];

    if(!getConfigInfo()['ENABLE_CONSOLE']) log = function(s?){}

    // account = await AccountSvc.create(web3, {address: PERSONAL_ACCOUNT, privateKey: PERSONAL_PRIVATE_KEY});
});
m.after(async () => {
//   web3.currentProvider.connection.close();
});

m.describe.skip('Utility', () => {
    m.it('should make IPFS call to get metadata', async function () {
        Ipfs.cat('ipfs://QmcmMzN4SdJByjd1qQ4oKFCJwYoGeFk5ze6wbS9GyBoh7Y');
    });
});