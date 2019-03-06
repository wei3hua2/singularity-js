import {Account} from './account';
import {Organization} from './organization';
import {Service, ServiceMetadata, ServiceInfo, ServiceFieldInfo} from './service';
import {Channel, ChannelState} from './channel';
import {InitOptions, RUN_JOB_STATE, RunJobOptions} from './options';

interface Data {
    isInit: boolean;
    data: Object;
    init(): Promise<any>;
}

export {Account, Organization, Service, Channel, ChannelState, InitOptions,
    ServiceMetadata, ServiceInfo, ServiceFieldInfo, Data, RUN_JOB_STATE, RunJobOptions};