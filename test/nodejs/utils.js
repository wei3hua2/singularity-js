const fs = require('fs');
const Web3 = require('web3');


function initWeb3 () {
    const NETWORKS = JSON.parse(fs.readFileSync('./test/config/NETWORKS.json','utf8'));
    const CONFIG = JSON.parse(fs.readFileSync('./test/config/CONFIG.json','utf8'));
    const web3Provider = NETWORKS[CONFIG['CHAINID']]['ws_provider'];
    
    return new Web3(new Web3.providers.WebsocketProvider(web3Provider));
}

function getConfigInfo () {
    const config = JSON.parse(fs.readFileSync('./test/config/CONFIG.json','utf8'));
    return config;
}

// export {initWeb3, getConfigInfo}
module.exports = {initWeb3, getConfigInfo}