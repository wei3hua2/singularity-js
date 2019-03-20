/**
 * @module snet
 */

import * as EventEmitter from 'eventemitter3';
import {Contract} from './contract';
import {Account} from '../models/account';
import {SnetError} from '../errors/snet-error';
//@ts-ignore
import RegistryNetworks from 'singularitynet-platform-contracts/networks/Registry.json';
//@ts-ignore
import RegistryAbi from 'singularitynet-platform-contracts/abi/Registry.json';

import {TransactOptions, EventOptions} from '../utils/eth';

class Registry extends Contract {
    constructor(account: Account){ super(account); }

    getAbi(){ return RegistryAbi; }
    getNetworkObj(){ return RegistryNetworks; }

    OrganizationCreated = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('OrganizationCreated', type, opt);
    OrganizationModified = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('OrganizationModified', type, opt);
    OrganizationDeleted = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('OrganizationDeleted', type, opt);
    ServiceCreated = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('ServiceCreated', type, opt);
    ServiceMetadataModified = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('ServiceMetadataModified', type, opt);
    ServiceTagsModified = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('ServiceTagsModified', type, opt);
    ServiceDeleted = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('ServiceDeleted', type, opt);
    TypeRepositoryCreated = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('TypeRepositoryCreated', type, opt);
    TypeRepositoryModified = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('TypeRepositoryModified', type, opt);
    TypeRepositoryDeleted = (type: string, opt:EventOptions={}): EventEmitter|Promise<any> => this.event('TypeRepositoryDeleted', type, opt);

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
                if(!svcReg.found) throw new SnetError('sv_registry_id_not_found', orgId, serviceId);

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


    // transact

    createOrganization = (orgId:string, orgName:string='', members:string[]=[]) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('createOrganization',oId, orgName, members);
    }

    changeOrganizationOwner = (orgId:string, newOwner:string) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('changeOrganizationOwner',oId,newOwner);
    }
    changeOrganizationName = (orgId:string, orgName:string) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('changeOrganizationName',oId,orgName);
    }
    addOrganizationMembers = (orgId:string, newMembers:string[]) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('addOrganizationMembers',oId,newMembers);
    }
    removeOrganizationMembers = (orgId:string, existingMembers:string[]) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('removeOrganizationMembers',oId,existingMembers);
    }
    deleteOrganization = (orgId:string) => {
        const oId = this.eth.asciiToBytes(orgId);
        return this.transactContract('deleteOrganization',oId);
    }

    createServiceRegistration = (orgId:string, serviceId:string, metadataURI:string='', tags:string[]=[]) => {
        const that = this;
        const oId = this.eth.asciiToBytes(orgId), sId = this.eth.asciiToBytes(serviceId);
        const mdURI = this.eth.asciiToBytes(metadataURI);
        const ts = tags.map(function(t){return that.eth.asciiToBytes(t);});

        return this.transactContract('createServiceRegistration',oId, sId, mdURI, ts);
    }
    updateServiceRegistration = (orgId:string, serviceId:string, metadataURI:string='') => {
        const oId = this.eth.asciiToBytes(orgId), sId = this.eth.asciiToBytes(serviceId);
        const mdURI = this.eth.asciiToBytes(metadataURI);

        return this.transactContract('updateServiceRegistration',oId, sId, mdURI);
    }
    addTagsToServiceRegistration = (orgId:string, serviceId:string, tags:string[]=[]) => {
        const that = this;
        const oId = this.eth.asciiToBytes(orgId), sId = this.eth.asciiToBytes(serviceId);
        const ts = tags.map(function(t){return that.eth.asciiToBytes(t);});

        return this.transactContract('addTagsToServiceRegistration',oId, sId, ts);
    }
    removeTagsFromServiceRegistration = (orgId:string, serviceId:string, tags:string[]=[]) => {
        const that = this;
        const oId = this.eth.asciiToBytes(orgId), sId = this.eth.asciiToBytes(serviceId);
        const ts = tags.map(function(t){return that.eth.asciiToBytes(t);});

        return this.transactContract('removeTagsFromServiceRegistration',oId, sId, ts);
    }
    deleteServiceRegistration = (orgId:string, serviceId:string) => {
        const oId = this.eth.asciiToBytes(orgId), sId = this.eth.asciiToBytes(serviceId);

        return this.transactContract('deleteServiceRegistration', oId, sId);
    }

    createTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string, tags:string[]) => this.transactContract('createTypeRepositoryRegistration',orgId,repositoryId,repositoryURI,tags);
    updateTypeRepositoryRegistration = (orgId:string, repositoryId:string, repositoryURI:string) => this.transactContract('updateTypeRepositoryRegistration',orgId, repositoryId, repositoryURI);
    addTagsToTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[]) => this.transactContract('addTagsToTypeRepositoryRegistration',orgId, repositoryId, tags);
    removeTagsFromTypeRepositoryRegistration = (orgId:string, repositoryId:string, tags:string[]) => this.transactContract('removeTagsFromTypeRepositoryRegistration',orgId, repositoryId, tags);
    deleteTypeRepositoryRegistration = (orgId:string, repositoryId:string) => this.transactContract('deleteTypeRepositoryRegistration',orgId,repositoryId);
}

export {Registry}