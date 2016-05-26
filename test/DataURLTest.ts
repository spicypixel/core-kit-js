/// <reference path="../typings/index.d.ts" />

import * as chai from "chai";
import SpicyPixel from "../dist/spicypixel-core";

var should = chai.should();

describe ("DataURL", () => {
  it ("should construct from unicode string", () => {
    let url = SpicyPixel.Core.DataURL.createFromUnicodeString("Test");
    url.toString().should.equal("data:,Test");
    url.isBase64.should.be.false;
  });
});