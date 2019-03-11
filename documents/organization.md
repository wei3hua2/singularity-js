# Organization

Model for organization. Organization object can be retrieved from the `Snet` model with either `listOrganization` or `getOrganization` method.
``` javascript
const orgs = await snet.listOrganizations();
console.log(orgs[0]);
// {id: 'snet'}

const org = await snet.getOrganization('snet');
console.log(org);
// { id: 'snet',
//     name: 'snet',
//     owner: '0xFF2a327ed1Ca40CE93F116C5d6646b56991c0ddE',
//     members:
//      [ '0x4b4546ce47089925E5792E0a6d085BfB876cE621',... ]}
```

*   [getServices](#getServices)
*   [getService](#getService)
*   [init](#init)
*   [data](#data)


## getServices
Get all available services from the organization.
``` javascript
 const services = await organization.getServices();

 const services = await organization.getServices({init:true});
```
##### Parameters
1. __InitOptions__ Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Service[]__ [Service](service.md) Object.


## getService
``` javascript
const service = await organization.getService('example-service');
// { id: 'example-service',
//   organizationId: 'snet',
//   metadata:
//    { version: 1,
//      display_name: 'SingularityNET Example Service',
//      encoding: 'proto',
//      service_type: 'grpc', ... } },
//   tags: [ 'Service', 'Example', 'Arithmetic' ] }

const service = await organization.getService('example-service', {init:false});
console.log(service.data);
// {id: 'example-service', organizationId: 'snet'}
```
##### Parameters
1. __serviceId__ *string* 
2. __InitOptions__ *object* (optional) Options for initialising a model.
    * init: default to false. Only id is retrieve.
##### Returns
- __Service__ [Service](service.md) object.


## init
``` javascript
const org = await snet.getOrganization('snet', {init:false});
console.log(org.isInit);
// false
console.log(org.data);
// {id: 'snet'}

await org.init();

console.log(orgservice.isInit);
// true
console.log(org.data);
// { id: 'snet',
//   name: 'snet',
//   owner: '0xFF2a327ed1Ca40CE93F116C5d6646b56991c0ddE',
//   members:
//      [ '0x4b4546ce47089925E5792E0a6d085BfB876cE621',... ]}
```
##### Parameters
none
##### Returns
- __Organization__ Initialized Organization object.


## data
``` javascript
 console.log(organization.data);
```
##### Parameters
none
##### Returns
- __id__ *string*
- __name__ *string*
- __owner__ *string*
- __members__ *string[]*