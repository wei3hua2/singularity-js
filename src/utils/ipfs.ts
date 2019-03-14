import axios from 'axios';
import {CONFIG} from '../configs/config';
import {Logger} from '../utils/logger';

const log = Logger.logger();

class Ipfs {
    static IPFS_API_URL = CONFIG.IPFS_URL;

    static async cat(hash:string) {
        hash = hash.replace('ipfs://', '');
        const url = this.IPFS_API_URL+'cat?arg='+hash;
        log.debug('Ipfs.cat > cat '+url);

        const result = (await axios.get(url)).data;
        log.debug('Ipfs.cat >> cat');
        log.debug(JSON.stringify(result));

        return result;
    }
}

// http://ipfs.singularitynet.io/api/v0/cat?arg=QmZrWe2aPnzXqYvWgZGquUNs4Y7TjxyyEuNrGf5v5y4GMR

export {Ipfs}