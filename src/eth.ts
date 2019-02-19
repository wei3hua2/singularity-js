/**
 * @hidden
 */


class EthUtil {
    web3: any;
    isVersion1Beyond: boolean;

    constructor(web3: any){
        this.web3 = web3;
        this.isVersion1Beyond = !(this.getWeb3Version()[0] === '0');
    }

    close(): any {
        return this.web3.currentProvider.connection.close();
    }

    getWeb3Version():string {
        return this.web3.version.api ? this.web3.version.api : this.web3.version;
    }

    getNetworkId(): Promise<any> {
        if(this.isVersion1Beyond)
            return this.web3.eth.net.getId();
        else
            return new Promise((resolve, reject) => {
                this.web3.version.getNetwork((err, netId) => {
                    if(err) reject(err);
                    else resolve(netId);
                });
            });
    }

    getBlockNumber(): Promise<number> {
        return new Promise( (resolve, reject) => {
            this.web3.eth.getBlockNumber((error, result) => {
                if(error) reject(error);
                else resolve(result);
            });
        });
    }

    getAccounts(): Promise<string[]> {
        return this.web3.eth.getAccounts();
    }

    getContract(abi:any, address:string) {
        return new this.web3.eth.Contract(abi, address);
    }

    fromAscii(strVal: string): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.fromAscii(strVal);
        else
            return this.web3.fromAscii(strVal);
    }
    toUtf8(strVal: string): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.toUtf8(strVal);
        else
            return this.web3.toUtf8(strVal);
    }
    toHex(strVal: string|number): any {
        if(this.isVersion1Beyond)
            return this.web3.utils.toHex(strVal);
        else
            return this.web3.toHex(strVal);
    }

    soliditySha3(...params) {
        return this.web3.utils.soliditySha3(...params);
    }
    sign(sha3Message:string, opts:SignOptions = {}) {
        if(opts.privateKey) return this.web3.eth.accounts.sign(sha3Message, opts.privateKey);
        else throw new Error('No approach to signing');
    }

    async signMessage(message:any, privateKey:string = null) : Promise<Buffer>{
        const sha3Message: string = this.soliditySha3(...message);
        const signed = (await this.sign(sha3Message, {privateKey:privateKey})).signature;
        const stripped = signed.substring(2, signed.length);
        
        return new Buffer(Buffer.from(stripped, 'hex'));
    }
}

interface TransactOptions {
    from?: string;
    gasPrice?: string;
    gas?: number;
    value?: number;
}
interface SignOptions {
    privateKey?: string;
}

export {EthUtil, TransactOptions}