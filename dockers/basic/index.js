const {Snet} =  require('../singularity-js/dist/snet');
const Web3 = require('web3');

const SINGNET_ACCOUNT_ADDRESS = process.env.SINGNET_ACCOUNT_ADDRESS || 'EMPTY';
const SINGNET_ACCOUNT_PK = process.env.SINGNET_ACCOUNT_PK || 'EMPTY';
const ROPSTEN_WSS = "wss://ropsten.infura.io/ws";

console.log('address     : '+SINGNET_ACCOUNT_ADDRESS);
console.log('private key : '+SINGNET_ACCOUNT_PK.substr(0, 5)+'****************');

(async function() {
    const web3 = new Web3(new Web3.providers.WebsocketProvider(ROPSTEN_WSS));

    try{
        const snet = await Snet.init(web3, {address: SINGNET_ACCOUNT_ADDRESS, privateKey: SINGNET_ACCOUNT_PK});

        const orgs = await snet.listOrganizations({init: true});
    
        orgs.forEach(org => {
            console.log('Id        : ' + org.data.id);
            console.log('name      : ' + org.data.name);
            console.log('owner     : ' + org.data.owner);
            console.log('members   : ' + org.data.members);
            console.log('services  : ' + org.data.services.map(s => s.data.id));
            console.log();
        });

    }catch(err){
        console.error(err);
    }finally {
        web3.currentProvider.connection.close();
    }
})();