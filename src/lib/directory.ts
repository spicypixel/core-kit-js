import { Promise } from "./promise";
import FileSystemEntry from "./file-system-entry";
import * as fs from "fs-extra";
let fsp = <any>Promise.promisifyAll(fs);

export default class Directory extends FileSystemEntry {
  static createAsync(path: string): Promise<any> {
    return fsp.mkdirAsync(path);
  }

  static createRecursiveAsync(path: string): Promise<any> {
    return fsp.mkdirpAsync(path);
  }

  static copyAsync(src: string, dest: string): Promise<any> {
    return fsp.copyRecursiveAsync(src, dest);
  }

  static removeAsync(path: string): Promise<any> {
    return fsp.rmRecursiveAsync(path);
  }
}