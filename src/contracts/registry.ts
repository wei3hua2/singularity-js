/**
 * @module snet
 */

import {Contract} from './contract';
import {Account} from '../account';

//@ts-ignore
import RegistryNetworks from 'singularitynet-platform-contracts/networks/Registry.json';
//@ts-ignore
import RegistryAbi from 'singularitynet-platform-contracts/abi/Registry.json';

import {TransactOptions} from '../eth';

class Registry extends Contract {
    constructor(account: Account){ super(account); }

    getAbi(){ return RegistryAbi; }
    getNetworkObj(){ return RegistryNetworks; }

    OrganizationCreated = () => this.eventContract('OrganizationCreated');
    OrganizationModified = () => this.eventContract('OrganizationModified');
    OrganizationDeleted = () => this.eventContract('OrganizationDeleted');
    ServiceCreated = () => this.eventContract('ServiceCreated');
    ServiceMetadataModified = () => this.eventContract('ServiceMetadataModified');
    ServiceTagsModified = () => this.eventContract('ServiceTagsModified');
    ServiceDeleted = () => this.eventContract('ServiceDeleted');
    TypeRepositoryCreated = () => this.eventContract('TypeRepositoryCreated');
    TypeRepositoryModified = () => this.eventContract('TypeRepositoryModified');
    TypeRepositoryDeleted = () => this.eventContract('TypeRepositoryDeleted');

    /******* Call *******/

    listOrganizations = () => {
        return this.callContract('listOrganizations').then(
            (orgAddresses) => {
                const orgs = Array.from(orgAddresses.orgIds);
                return orgs.map((org:string) => this.eth.hexToUtf8(org));
            });
    }
    getOrganizationById = (orgId: string) => {
        return this.callContract('getOrganizationById', this.eth.asciiToBytes(orgId)).then(
            (org) => {
                const svcIds = Array.from(org.serviceIds), repoIds = Array.from(org.repositoryIds);
                
                org.id = this.eth.hexToUtf8(org.id),
                org.serviceIds = svcIds.map((svcId:string) => this.eth.hexToUtf8(svcId)),
                org.repositoryIds = repoIds.map((repoId:string) => this.eth.hexToUtf8(repoId))
                
                return org;
            }
        );
    }
    listServicesForOrganization = (orgId: string) => {
        return this.callContract('listServicesForOrganization', this.eth.asciiToBytes(orgId)).then(
            (svcs) => {
                const svcIds = Array.from(svcs.serviceIds);
                svcs.serviceIds = svcIds.map((s:string) => this.eth.hexToUtf8(s));

                return svcs;
            }
        );
    }
    getServiceRegistrationById = (orgId: string, serviceId: string) => {
        return this.callContract('getServiceRegistrationById', this.eth.asciiToBytes(orgId), this.eth.asciiToBytes(serviceId)).then(
            (svcReg) => {
                const tags = Array.from(svcReg.tags);
                svcReg.id = this.eth.hexToUtf8(svcReg.id);
                svcReg.metadataURI = svcReg.metadataURI ?  this.eth.hexToUtf8(svcReg.metadataURI) : svcReg.metadataURI;
                svcReg.tags = tags.map((t:string) => this.eth.hexToUtf8(t));

                return svcReg;
            }
        );
    }
    listTypeRepositoriesForOrganization = (orgId: string) => {
        return this.callContract('listTypeRepositoriesForOrganization', this.eth.asciiToBytes(orgId)).then(
            (typeRepos) => {
                const repoIds = Array.from(typeRepos.repositoryIds)
                typeRepos.repositoryIds = repoIds.map((r:string) => this.eth.hexToUtf8(r));

                return typeRepos;
            }
        )
    }

    
    listServiceTags = () => this.callContract('listServiceTags').then((svcTags) => {
        return {tags: Array.from(svcTags.tags).map((t:string) => this.eth.hexToUtf8(t))};
    });
    listServicesForTag = (tag: string) => {
        return this.callContract('listServicesForTag', this.eth.asciiToBytes(tag)).then(
            (svcs) => {
                const orgIds = Array.from(svcs.orgIds);
                const serviceIds = Array.from(svcs.serviceIds);
                svcs.orgIds = orgIds.map((o:string) => this.eth.bytesToAscii(o));
                svcs.serviceIds = serviceIds.map((s:string) => this.eth.bytesToAscii(s));

                return svcs;
            });
    }

    listTypeRepositoryTags = () => this.callContract('listTypeRepositoryTags'); //TODO
    listTypeRepositoriesForTag = (tag: string) => this.callContract('listTypeRepositoriesForTag', this.fromAscii(tag)); //TODO
    supportsInterface = (interfaceId: string) => this.callContract('supportsInterface', interfaceId); //TODO
    getTypeRepositoryById = (orgId: string, repositoryId: string) => this.callContract('getTypeRepositoryById', this.fromAscii(orgId), this.fromAscii(repositoryId)); //TODO

    createOrganization = (orgId:string, orgName:string, 
        members:string[], txOpt:TransactOptions={}) => this.transactContract('createOrganization',txOpt,orgId,orgName,members);
    changeOrganizationOwner = (orgId:string, newOwner:string, txOpt:TransactOptions={}) => this.transactContract('changeOrganizationOwner',txOpt,orgId,newOwner);
    changeOrganizationName = (orgId:string, orgName:string, txOpt:TransactOptions={}) => this.transactContract('changeOrganizationName',txOpt,orgId,orgName);
    addOrganizationMembers = (orgId:string, newMembers:string[], txOpt:TransactOptions={}) => this.transactContract('addOrganizationMembers',txOpt,orgId,newMembers);
    removeOrganizationMembers = (orgId:string, existingMembers:string[], txOpt:TransactOptions={}) => this.transactContract('removeOrganizationMembers',txOpt,orgId,existingMembers);
    deleteOrganization = (orgId:string, txOpt:TransactOptions={}) => this.transactContract('deleteOrganization',txOpt,orgId);

    createServiceRegistration = (orgId:string, serviceId:string, metadataURI:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('createServiceRegistration',txOpt,orgId,serviceId,metadataURI,tags);
    updateServiceRegistration = (orgId:string, serviceId:string, metadataURI:string, txOpt:TransactOptions={}) => this.transactContract('updateServiceRegistration',txOpt, orgId,serviceId, metadataURI);
    addTagsToServiceRegistration = (orgId:string, serviceId:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('addTagsToServiceRegistration',txOpt, orgId, serviceId, tags);
    removeTagsFromServiceRegistration = (orgId:string, serviceId:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('removeTagsFromServiceRegistration',txOpt, orgId, serviceId, tags);
    deleteServiceRegistration = (orgId:string, serviceId:string, txOpt:TransactOptions={}) => this.transactContract('deleteServiceRegistration',txOpt, orgId, serviceId);

    createTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('createTypeRepositoryRegistration',txOpt,orgId,repositoryId,repositoryURI,tags);
    updateTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string, txOpt:TransactOptions={}) => this.transactContract('updateTypeRepositoryRegistration',txOpt,orgId, repositoryId, repositoryURI);
    addTagsToTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('addTagsToTypeRepositoryRegistration',txOpt,orgId, repositoryId, tags);
    removeTagsFromTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[], txOpt:TransactOptions={}) => this.transactContract('removeTagsFromTypeRepositoryRegistration',txOpt,orgId, repositoryId, tags);
    deleteTypeRepositoryRegistration = (orgId:string, repositoryId:string, txOpt:TransactOptions={}) => this.transactContract('deleteTypeRepositoryRegistration',txOpt,orgId,repositoryId);
}

export {Registry}