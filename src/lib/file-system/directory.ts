import Bluebird from "../promise";
import FileSystemRecord from "./file-system-record";
import * as fs from "fs-extra";
let fsp = <any>Bluebird.promisifyAll(fs);

export default class Directory extends FileSystemRecord {
  static createAsync(path: string): Promise<void> {
    return fsp.mkdirAsync(path);
  }

  static createRecursiveAsync(path: string): Promise<void> {
    return fsp.mkdirpAsync(path);
  }

  static copyAsync(src: string, dest: string): Promise<void> {
    return fsp.copyRecursiveAsync(src, dest);
  }

  static removeAsync(path: string): Promise<void> {
    return fsp.rmdirAsync(path);
  }

  static removeRecursiveAsync(path: string): Promise<void> {
    return fsp.removeAsync(path);
  }
}