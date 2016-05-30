import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { Platform } from "../lib/platform";

let should = chai.should();
chai.use(chaiAsPromised);

describe("Platform", () => {
  it("should return info", () => {
    Platform.info.should.be.ok;
  });
});