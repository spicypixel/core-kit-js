import { File, Directory } from "../lib/file-system";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fs from "fs-extra";

let should = chai.should();
chai.use(chaiAsPromised);

describe("File", () => {
  it("should copy", async function() {
    await Directory.createRecursiveAsync("./test-output");
    fs.writeFileSync("./test-output/test.txt", "Test");
    await File.copyAsync("./test-output/test.txt", "./test-output/test2.txt");
    await Directory.removeRecursiveAsync("./test-output");
  });
});