import {SnetError, ERROR_CODES} from '../errors/snet-error';
import {RUN_JOB_STATE, Account, Channel, InitOptions} from '../models';

abstract class SvcRegistry {
    id: string;
    organizationId: string;
    isMetaInit: boolean;
    account: Account;
    isRegistryInit: boolean;

    abstract get endpoint (): string;
    abstract get paymentAddress():string;
    abstract get groupId():string;
    abstract get price():number;
    abstract set data(data:Object);

    public async initRegistry(): Promise<any> {
        if(this.isRegistryInit) return this;

        const svcReg = await this.account.registry.getServiceRegistrationById(this.organizationId, this.id);

        this.data = {tags: svcReg.tags, metadataURI: svcReg.metadataURI};

        this.isRegistryInit = true;

        return this;
    }

    public async openChannel(amount:number, expiration: number): Promise<any> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);
        
        const channel = await Channel.openChannel(
            this.account, this.account.address, this.paymentAddress, 
            this.groupId, amount, expiration);
        
        channel['endpoint'] = this.endpoint;

        return channel;
    }
    public async getChannels(opts:InitOptions={init:false}): Promise<Channel[]> {
        if(!this.isMetaInit) throw new SnetError(ERROR_CODES.svc_metadata_not_init);

        const sender = this.account.address, recipient = this.paymentAddress, groupId = this.groupId;

        const channels:Channel[] = await this.account.getChannels({filter: {recipient: recipient, sender: sender, groupId: groupId}}, opts);

        channels.forEach(c => { c.endpoint = this.endpoint });

        return Array.from(channels);
    }

}

export {SvcRegistry}