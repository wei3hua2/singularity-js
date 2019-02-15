import {Marketplace} from './marketplace';

class Channels {
    marketplace: Marketplace;

    constructor(marketplace: Marketplace){
        this.marketplace = marketplace;
    }

    async getAvailableChannels(userAddress:string, serviceId:string, orgId:string) {
        return await this.marketplace.availableChannels(userAddress, serviceId, orgId);
    }
}

export {Channels}