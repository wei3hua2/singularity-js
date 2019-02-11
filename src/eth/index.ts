import * as Promise from 'bluebird';

class Eth {
    web3: any;
    constructor(web3: any){
        this.web3 = web3;
    }

    getBlockNumber(): Promise<number> {
        return this.web3.eth.getBlockNumber();
    }
}

export {Eth}