import {EthUtil} from './eth';

class Utils {
    eth: EthUtil;
    constructor(eth: EthUtil) {
        this.eth = eth;
    }

    getBlockNumber(): Promise<number> {
        return this.eth.getBlockNumber();
    }

    listenNewBlockHeaders() {
        return this.eth.listenBlockHeaders();
    }
}

export {Utils};