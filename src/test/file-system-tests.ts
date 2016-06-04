import * as FileSystem from "../lib/file-system";
import File = FileSystem.File;
import Directory = FileSystem.Directory;
import FileSystemPermission = FileSystem.FileSystemPermission;

import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fs from "fs-extra";

let should = chai.should();
chai.use(chaiAsPromised);

describe("FileSystem", () => {
  beforeEach("setup test output", async function() {
    await Directory.createRecursiveAsync("./test-output");
    fs.writeFileSync("./test-output/test.txt", "Test");
  });

  afterEach("clear test output", async function() {
    await Directory.removeRecursiveAsync("./test-output");
  });

  it("should copy file", async function () {
    await File.copyAsync("./test-output/test.txt", "./test-output/test2.txt");
  });

  it("should access file", async function () {
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Read)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Write | FileSystemPermission.Execute)
      .should.eventually.be.rejected;
  });

  it("should copy pattern", async function () {
    await File.copyAsync("./test-output/test.txt", "./test-output/test2.txt");
    await File.copyAsync("./test-output/test.txt", "./test-output/test3.md");
    await FileSystem.Directory.createRecursiveAsync("./test-output/copy-test");
    await FileSystem.copyPatternsAsync("./test-output/*.txt", "./test-output/copy-test");
    await File.accessAsync("./test-output/copy-test/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/copy-test/test2.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/copy-test/test3.md",
      FileSystemPermission.Visible)
      .should.eventually.be.rejected;
  });

  it("should remove pattern", async function () {
    await File.copyAsync("./test-output/test.txt", "./test-output/test2.txt");
    await File.copyAsync("./test-output/test.txt", "./test-output/test3.md");
    await FileSystem.removePatternsAsync("./test-output/*.txt");
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.rejected;
    await File.accessAsync("./test-output/test2.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.rejected;
    await File.accessAsync("./test-output/test3.md",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });
});