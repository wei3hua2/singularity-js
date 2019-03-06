# Product Name
> Javascript library for singularitynet


One to two paragraph statement about your product and what it does.

## Prerequisite



## Installation


```sh
npm install singularitynet-js --save
```


## Usage example

A few motivating and useful examples of how your product can be used. Spice this up with code blocks and potentially more screenshots.

_For more examples and usage, please refer to the [Wiki][wiki]._


## Models

There are 4 main model for this library:
- AccountSvc
- OrganizationSvc
- ServiceSvc 
- ChannelSvc/ChannelSvc State

### AccountSvc
Contains the current logged in account. This class operations that helps with the account holder. Such as retrieving AGI token counts, deposit to escrow, add fund to existing channel etc.



### OrganizationSvc


### ServiceSvc


### ChannelSvc / ChannelSvc State


When `Snet.init(web3)` is call, an entry object is created. This object contains helper functions to gather and execute functions from some of these models.

### Run Job

The `runJob` method is an alias to the class "ServiceSvc". 

### AccountSvc


### OrganizationSvc


### ServiceSvc


### ChannelSvc




## Documentation

For full documentation. Please refer to the page [Full Documentation](docs/README.md).


## Release History

* 0.1.0
    * The first proper release
    * CHANGE: Rename `foo()` to `bar()`

## Meta

James Chong – [@wei3hua2](https://twitter.com/wei3hua2) – [email@jameschong.me](mailto:email@jameschong.me)

Distributed under the MIT license. See ``LICENSE`` for more information.

[LICENSE](LICENSE)

