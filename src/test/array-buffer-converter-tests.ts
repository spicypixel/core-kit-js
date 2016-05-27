/// <reference path="../../typings/index.d.ts" />

import * as chai from "chai";
import { ArrayBufferConverter } from "../lib/array-buffer-converter";

var should = chai.should();

describe("ArrayBufferConverter", () => {
  it("should convert", () => {
    let testString = "Test";

    let arrayBuffer = ArrayBufferConverter.fromBinaryString(testString);
    arrayBuffer.byteLength.should.equal(4);

    let binaryString = ArrayBufferConverter.toBinaryString(arrayBuffer);
    binaryString.should.equal(testString);

    let base64 = ArrayBufferConverter.toBase64(arrayBuffer);
    base64.should.equal("VGVzdA==");

    let arrayBufferFromBase64 = ArrayBufferConverter.fromBase64(base64);
    equal(arrayBuffer, arrayBufferFromBase64).should.be.true;
    
    let decodedBase64 = ArrayBufferConverter.toBinaryString(arrayBufferFromBase64);
    decodedBase64.should.equal(testString);
  });
});

function equal(buf1: ArrayBuffer, buf2: ArrayBuffer) {
  if (buf1.byteLength != buf2.byteLength)
    return false;

  var dv1 = new Int8Array(buf1);
  var dv2 = new Int8Array(buf2);

  for (var i = 0; i < buf1.byteLength; i++) {
    if (dv1[i] != dv2[i])
      return false;
  }
  return true;
}