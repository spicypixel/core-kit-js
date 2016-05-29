import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { ChildProcess } from "../lib/child-process";

let should = chai.should();
chai.use(chaiAsPromised);

describe("ChildProcess", () => {
  it("should spawn", () => {
    return ChildProcess.spawnAsync("pwd").should.be.fulfilled;
  });

  it("should fail spawn", () => {
    return ChildProcess.spawnAsync("undefined").should.be.rejected;
  });
});