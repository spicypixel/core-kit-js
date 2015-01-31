// jshint -W004
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['crypto-js/core', 'crypto-js/md5', 'crypto-js/lib-typedarrays'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(require('crypto-js/core'), require('crypto-js/md5'), require('crypto-js/lib-typedarrays'));
  } else {
    // Browser globals
    root.SpicyPixel = root.SpicyPixel || {};
    root.SpicyPixel.Map = factory(root.CryptoJS, root.CryptoJS.MD5, root.CryptoJS.lib.WordArray);
  }
}(this, function (CryptoJS, cryptojsmd5, cryptojswordarray) {
  // Reparent CryptoJS back to match global name
  CryptoJS.MD5 = CryptoJS.MD5 || cryptojsmd5;
  CryptoJS.lib = CryptoJS.lib || {};
  CryptoJS.lib.WordArray = CryptoJS.lib.WordArray || cryptojswordarray;

  %= body %

  return SpicyPixel.Map;
}));
// jshint +W004