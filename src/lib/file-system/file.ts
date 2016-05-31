import Promise from "../promise";
import FileSystemRecord from "./file-system-record";
import * as fs from "fs-extra";
let fsp = <any>Promise.promisifyAll(fs);

export default class File extends FileSystemRecord {
  static copyAsync(src: string, dest: string): Promise<any> {
    return fsp.copyAsync(src, dest);
  }

  static removeAsync(path: string): Promise<any> {
    return fsp.unlinkAsync(path);
  }
}