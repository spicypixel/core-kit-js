/// <reference path="../../typings/index.d.ts" />

import * as chai from "chai";
import { DataURL } from "../lib/data-url";

var should = chai.should();

describe ("DataURL", () => {
  it ("should construct from unicode string", () => {
    let url = DataURL.createFromUnicodeString("Test");
    url.toString().should.equal("data:,Test");
    url.isBase64.should.be.false;
  });
});