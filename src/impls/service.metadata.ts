import {Ipfs} from '../utils/ipfs';
import {ServiceMetadata} from '../models';
import {ERROR_CODES, SnetError} from '../errors';

abstract class SvcMetadata {
    metadata?: ServiceMetadata;
    metadataURI?: string;
    isMetaInit: boolean;

    abstract set data(data:Object);
    abstract initRegistry(): Promise<any>;

    public async initMetadata(): Promise<any> {
        if(this.isMetaInit) return this;

        await this.initRegistry();
        
        const metadata = await Ipfs.cat(this.metadataURI);
        this.data = {metadata: metadata};
        
        this.isMetaInit = true;

        return this;
    }
}

export {SvcMetadata}