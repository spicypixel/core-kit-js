import Promise from "../promise";
import FileSystemEntry from "./file-system-entry";
import * as fs from "fs-extra";
let fsp = <any>Promise.promisifyAll(fs);

export default class File extends FileSystemEntry {
  static copyAsync(src: string, dest: string): Promise<any> {
    return fsp.copyAsync(src, dest);
  }

  static removeAsync(path: string): Promise<any> {
    return fsp.unlinkAsync(path);
  }
}