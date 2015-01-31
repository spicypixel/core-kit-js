module SpicyPixel {
    export class Imports {
    }
}

declare var module:any;
declare var exports:any;
declare var define:any;
declare var require:any;

(function (root:any, factory:any) {
    if (typeof define === 'function' && define.amd) {
        // AMD anonymous module
        define([], factory);
    } else if (typeof exports === 'object') {
        // CommonJS anonymous module
        module.exports = factory();
    } else {
        // Browser globals
        root.SpicyPixel = factory();
    }
})(this, function () {
    return SpicyPixel;
});