/**
 * @module snet
 */

import {EthUtil} from './eth';
import axios from 'axios';


import {NETWORK} from '../configs/network';

class Marketplace {
    eth: EthUtil;
    constructor(eth){
        this.eth = eth;
        // axios.interceptors.response.use(
        //     (response) => {console.log('response : '+response['data']); return response['data'];},
        //     (error) => Promise.reject(error));
    }

    getServices = () => this.get('service');

    getChannels = (user_address: string) => this.get('channels?user_address=' + user_address);

    fetchVotes = (user_address: string) => this.get('fetch-vote?user_address=' + user_address);

    userVote = (vote: any) => this.get('user-vote?vote=' + vote);

    groupInfo = () => this.get('group-info');

    organizations = () => this.get('organizations');

    organization = (orgId: string) => this.get('organizations/' + orgId);

    organizationServices = (orgId: string) => this.get('organizations/' + orgId + '/services');
    
    organizationService = (orgId: string, serviceId: string) => this.get('organizations/' + orgId + '/services/' + serviceId);
    
    expiredChannels = (user_address: string) => this.get('expired-channels?user_address=' + user_address);
    
    availableChannels = (userAddress: string, serviceId: string, orgId: string) => 
            this.get('available-channels?user_address=' + userAddress + '&service_id=' + serviceId + '&org_id=' + orgId);

    // tags = (tags: string) => this.get('tags/' + tags);
    // updateServiceStatus = (tags: string) => this.get('update-service-status');

    private async get(uri: string) {
        const url = await this.getMarketplaceUrl();
        const payload = await axios.get(url + uri);

        return payload.data;
    }

    private async getMarketplaceUrl(): Promise<string> {
        const network = await this.getMarketplaceInfo();
        return network.marketplace;
    }

    private async getMarketplaceInfo (): Promise<any> {
        const netId = await this.eth.getNetworkId();
        const network = NETWORK[netId];
        network.id = netId;

        return network;
    }
}

export {Marketplace}