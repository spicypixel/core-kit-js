import * as FileSystem from "../lib/file-system";
import File = FileSystem.File;
import Directory = FileSystem.Directory;
import FileSystemPermission = FileSystem.FileSystemPermission;

import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as path from "path";

let should = chai.should();
chai.use(chaiAsPromised);

describe("FileSystem", () => {
  beforeEach("setup test output", async function() {
    await Directory.createRecursiveAsync("./test-output");
    await File.writeFileAsync("./test-output/test.txt", "Test");
  });

  afterEach("clear test output", async function() {
    await Directory.removeRecursiveAsync("./test-output");
  });

  it("should read file", async function () {
    let result = await File.readFileAsync("./test-output/test.txt", "utf8");
    result.should.equal("Test");
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

  it("should not remove pattern with not", async function () {
    await FileSystem.removePatternsAsync(["./test-output/*.txt", "!./**/*.txt"]);
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });

  it("should not remove relative pattern with not", async function () {
    await FileSystem.removePatternsAsync(["test-output/*.txt", "!**/*.txt"]);
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });

  it("should not remove absolute pattern with not", async function () {
    await FileSystem.removePatternsAsync([path.resolve("./test-output/*.txt"), "!**/*.txt"]);
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });

  it("should remove with cwd", async function () {
    await FileSystem.removePatternsAsync("*.txt", { cwd: "./test-output" });
    await File.accessAsync("./test-output/test.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.rejected;
  });

  it("should copy and not flatten", async function () {
    await Directory.createRecursiveAsync("./test-output/f1");
    await Directory.createRecursiveAsync("./test-output/f2");
    await File.copyAsync("./test-output/test.txt", "./test-output/f1/test1.txt");
    await File.copyAsync("./test-output/test.txt", "./test-output/f2/test2.txt");
    await FileSystem.copyPatternsAsync("./test-output/**/*.txt", "./test-output/f3");
    await File.accessAsync("./test-output/f3/f1/test1.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/f3/f2/test2.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });

  it("should copy and flatten", async function () {
    await Directory.createRecursiveAsync("./test-output/f1");
    await Directory.createRecursiveAsync("./test-output/f2");
    await File.copyAsync("./test-output/test.txt", "./test-output/f1/test1.txt");
    await File.copyAsync("./test-output/test.txt", "./test-output/f2/test2.txt");
    await FileSystem.copyPatternsAsync("./test-output/**/*.txt", "./test-output/f3", { flatten: true });
    await File.accessAsync("./test-output/f3/test1.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/f3/test2.txt",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });

  it("should remove unmatched directories", async function () {
    await Directory.createRecursiveAsync("./test-output/src1/test1");
    await Directory.createRecursiveAsync("./test-output/src1/test2");
    await Directory.createRecursiveAsync("./test-output/src1/test4");
    await Directory.createRecursiveAsync("./test-output/dest1/test1");
    await Directory.createRecursiveAsync("./test-output/dest1/test2");
    await Directory.createRecursiveAsync("./test-output/dest1/test3");
    await Directory.createRecursiveAsync("./test-output/dest1/test4");

    await File.accessAsync("./test-output/dest1/test3",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await Directory.removeUnmatchedAsync("./test-output/src1", "./test-output/dest1");
    await File.accessAsync("./test-output/dest1/test3",
      FileSystemPermission.Visible)
      .should.eventually.be.rejected;

    await File.accessAsync("./test-output/dest1/test1",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/dest1/test2",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
    await File.accessAsync("./test-output/dest1/test4",
      FileSystemPermission.Visible)
      .should.eventually.be.fulfilled;
  });
});