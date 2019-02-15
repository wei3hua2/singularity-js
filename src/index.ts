import * as snet from './snet';

const rootWindow = window;

(function (root, factory) {
    // // @ts-ignore
    // if (typeof define === 'function' && define.amd) {
    //     // AMD. Register as an anonymous module.
    //     // @ts-ignore
    //     define(['snet-webclient'], factory);
    if (typeof module === 'object' && module.exports) {
        // module.exports = factory(require('snet-webclient'));
        module.exports = factory(require('snet-webclient'));
    } else {
        root.snet = factory(snet);
    }
}(rootWindow || this, function (b) {
    return b;
}));