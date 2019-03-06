
SingularityNet-JS Documentation
----------------------

Prerequisite
------------

* web3.js version 1 and beyond
* node 

Installation
------------

### Node

```javascript
npm install singularitynet-js --save
```


Getting Started
---------------

```javascript

import {Snet} from 'singularitynet-js';
import {web3} from 'web3.js;

var snet = Snet.init(web3);

var evt = snet.runJob("snet", "example-service", "add", {a:5, b:6});


evt.on("channel", (channel) => {
    console.log("channel used : " + channel);
});

evt.then((response) => {
    // {value : 11}
    console.log(response.value);
});
```

Initialize a Snet instance by injecting `web3` object. 


To run a job, pass in the following parameters: 1. organization id, 2. service id, method of the service, 4. payload.




Modules
-------

*   [Snet](modules/snet.md)
*   [OrganizationSvc](modules/organization.md)
*   [ServiceSvc](modules/service.md)
*   [AccountSvc](modules/account.md)
*   [Repository](modules/repository.md)
*   [ChannelSvc](modules/channel.md)
*   [Contract](modules/contract.md)
*   [Error](modules/error.md)
*   [Marketplace](modules/marketplace.md)
*   [Utils](modules/utils.md)

