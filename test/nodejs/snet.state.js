const c = require('chai');
const m = require('mocha');
const Snet =  require('../../dist/snet').Snet;
const ServiceSvc =  require('../../dist/impls').ServiceSvc;
const OrganizationSvc =  require('../../dist/impls').OrganizationSvc;
const AccountSvc =  require('../../dist/impls').AccountSvc;
const Service =  require('../../dist/models').Service;
const Organization =  require('../../dist/models').Organization;
const Account =  require('../../dist/models').Account;
const Utils =  require('../../dist/utils').Utils;

const {Config} = require('../config/config');

let config, log;

m.before(async () => {
  config = await Config.init();
  log = config.log;
});
m.after(() => {
  config.teardown();
})

m.describe('snet-state', () => {

})
