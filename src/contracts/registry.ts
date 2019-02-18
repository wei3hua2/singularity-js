/**
 * @module Contract
 */

import {Contract} from './contract';
//@ts-ignore
import RegistryNetworks from 'singularitynet-platform-contracts/networks/Registry.json';
//@ts-ignore
import RegistryAbi from 'singularitynet-platform-contracts/abi/Registry.json';

import {TransactOptions} from '../eth';

class Registry extends Contract {
    constructor(eth: any){ super(eth); }

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
        const that = this;
        return this.callContract('listOrganizations').then(
            (val) => val.map.call(val, (v) => that.toUtf8(v)));
    }
    getOrganizationById = (orgId: string) => {
        const that = this;
        return this.callContract('getOrganizationById', this.fromAscii(orgId)).then(
            (org) => {
                org.id = that.toUtf8(org.id);
                org.serviceIds = org.serviceIds.map.call(org.serviceIds, (s) => that.toUtf8(s));
                org.repositoryIds = org.repositoryIds.map.call(org.repositoryIds, (s) => that.toUtf8(s));

                return org;
            }
        );
    }
    listServicesForOrganization = (orgId: string) => {
        const that = this;
        return this.callContract('listServicesForOrganization', this.fromAscii(orgId)).then(
            (svcs) => {
                svcs.serviceIds = svcs.serviceIds.map.call(svcs.serviceIds, (s) => that.toUtf8(s));
                return svcs;
            }
        );
    }
    getServiceRegistrationById = (orgId: string, serviceId: string) => {
        const that = this;
        return this.callContract('getServiceRegistrationById', this.fromAscii(orgId), this.fromAscii(serviceId)).then(
            (svcReg) => {
                svcReg.id = that.toUtf8(svcReg.id);
                svcReg.metadataURI = that.toUtf8(svcReg.metadataURI);
                svcReg.tags = svcReg.tags.map.call(svcReg.tags, (t) => that.toUtf8(t));

                return svcReg;
            }
        );
    }
    listTypeRepositoriesForOrganization = (orgId: string) => {
        const that = this;
        return this.callContract('listTypeRepositoriesForOrganization', this.fromAscii(orgId)).then(
            (typeRepos) => {
                typeRepos.repositoryIds = 
                    typeRepos.repositoryIds.map.call(typeRepos.repositoryIds, (t) => that.toUtf8(t));

                return typeRepos;
            }
        )
    }

    //TODO
    getTypeRepositoryById = (orgId: string, repositoryId: string) => this.callContract('getTypeRepositoryById', this.fromAscii(orgId), this.fromAscii(repositoryId));

    listServiceTags = () => this.callContract('listServiceTags').then((tags) => {
        const that = this;
        return tags.map.call(tags, (t) => that.toUtf8(t));
    });
    listServicesForTag = (tag: string) => {
        const that = this;
        return this.callContract('listServicesForTag', this.fromAscii(tag)).then(
            (svcs) => {
                svcs.orgIds = svcs.orgIds.map.call(svcs.orgIds, (o) => that.toUtf8(o));
                svcs.serviceIds = svcs.serviceIds.map.call(svcs.serviceIds, (o) => that.toUtf8(o));
                return svcs;
            });
    }
    listTypeRepositoryTags = () => this.callContract('listTypeRepositoryTags'); //TODO
    listTypeRepositoriesForTag = (tag: string) => this.callContract('listTypeRepositoriesForTag', this.fromAscii(tag)); //TODO
    supportsInterface = (interfaceId: string) => this.callContract('supportsInterface', interfaceId); //TODO


    createOrganization = (orgId:string, orgName:string, 
        members:string[], txOpt:TransactOptions) => this.transactContract('createOrganization',txOpt,orgId,orgName,members);
    changeOrganizationOwner = (orgId:string, newOwner:string, txOpt:TransactOptions) => this.transactContract('changeOrganizationOwner',txOpt,orgId,newOwner);
    changeOrganizationName = (orgId:string, orgName:string, txOpt:TransactOptions) => this.transactContract('changeOrganizationName',txOpt,orgId,orgName);
    addOrganizationMembers = (orgId:string, newMembers:string[], txOpt:TransactOptions) => this.transactContract('addOrganizationMembers',txOpt,orgId,newMembers);
    removeOrganizationMembers = (orgId:string, existingMembers:string[], txOpt:TransactOptions) => this.transactContract('removeOrganizationMembers',txOpt,orgId,existingMembers);
    deleteOrganization = (orgId:string, txOpt:TransactOptions) => this.transactContract('deleteOrganization',txOpt,orgId);

    createServiceRegistration = (orgId:string, serviceId:string, metadataURI:string, tags:string[], txOpt:TransactOptions) => this.transactContract('createServiceRegistration',txOpt,orgId,serviceId,metadataURI,tags);
    updateServiceRegistration = (orgId:string, serviceId:string, metadataURI:string, txOpt:TransactOptions) => this.transactContract('updateServiceRegistration',txOpt, orgId,serviceId, metadataURI);
    addTagsToServiceRegistration = (orgId:string, serviceId:string, tags:string[], txOpt:TransactOptions) => this.transactContract('addTagsToServiceRegistration',txOpt, orgId, serviceId, tags);
    removeTagsFromServiceRegistration = (orgId:string, serviceId:string, tags:string[], txOpt:TransactOptions) => this.transactContract('removeTagsFromServiceRegistration',txOpt, orgId, serviceId, tags);
    deleteServiceRegistration = (orgId:string, serviceId:string, txOpt:TransactOptions) => this.transactContract('deleteServiceRegistration',txOpt, orgId, serviceId);

    createTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string, tags:string[], txOpt:TransactOptions) => this.transactContract('createTypeRepositoryRegistration',txOpt,orgId,repositoryId,repositoryURI,tags);
    updateTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string, txOpt:TransactOptions) => this.transactContract('updateTypeRepositoryRegistration',txOpt,orgId, repositoryId, repositoryURI);
    addTagsToTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[], txOpt:TransactOptions) => this.transactContract('addTagsToTypeRepositoryRegistration',txOpt,orgId, repositoryId, tags);
    removeTagsFromTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[], txOpt:TransactOptions) => this.transactContract('removeTagsFromTypeRepositoryRegistration',txOpt,orgId, repositoryId, tags);
    deleteTypeRepositoryRegistration = (orgId:string, repositoryId:string, txOpt:TransactOptions) => this.transactContract('deleteTypeRepositoryRegistration',txOpt,orgId,repositoryId);
}

export {Registry}