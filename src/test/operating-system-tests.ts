import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { OperatingSystem as os } from "../lib/operating-system";

let should = chai.should();
chai.use(chaiAsPromised);

describe("OperatingSystem", () => {
  it("arch should not be undefined", () => {
    os.architecture.should.not.be.undefined;
  });

  it("cpus should have length greather than 0", () => {
    os.cpus.should.have.length.greaterThan(0);
  });

  it("endianness should not be undefined", () => {
    os.endianness.should.not.be.undefined;
  });

  it("eol should have length greater than 0", () => {
    os.eol.should.have.length.greaterThan(0);
  });

  it("freeMemory should be greater than 0", () => {
    os.freeMemory.should.be.greaterThan(0);
  });

  it("homeDirectory should have length greater than 0", () => {
    os.homeDirectory.should.have.length.greaterThan(0);
  });

  it("hostName should have length greater than 0", () => {
    os.hostName.should.have.length.greaterThan(0);
  });

  it("loadAverages should have length of 3", () => {
    os.loadAverages.should.have.lengthOf(3);
  });

  it("networkInterfaces should not be undefined", () => {
    os.networkInterfaces.should.not.be.undefined;
  });

  it("platform should not be undefined", () => {
    os.platform.should.not.be.undefined;
  });

  it("release should have length greater than 0", () => {
    os.release.should.have.length.greaterThan(0);
  });

  it("tempDirectory should have length greater than 0", () => {
    os.tempDirectory.should.have.length.greaterThan(0);
  });

  it("total memory should be greater than 0", () => {
    os.totalMemory.should.be.greaterThan(0);
  });

  it("uptimeSeconds should be greater than 0", () => {
    os.uptimeSeconds.should.be.greaterThan(0);
  });

  it("user should be populated", () => {
    os.user.should.not.be.undefined;
    os.user.username.should.have.length.greaterThan(0);
    os.user.gid.should.not.be.undefined;
    os.user.uid.should.not.be.undefined;
    os.user.shell.should.not.be.undefined;
    os.user.homedir.should.have.length.greaterThan(0);
  });
});