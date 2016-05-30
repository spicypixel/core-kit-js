import { Promise } from "../promise";
import * as fs from "fs-extra";
let fsp = <any>Promise.promisifyAll(fs);

export default class FileSystemEntry {
  static chmodAsync(path: string, mode: string | number): Promise<any> {
    return fsp.chmodAsync(path, mode);
  }

  static chownAsync(path: string, uid: number, gid: number): Promise<any> {
    return fsp.chownAsync(path, uid, gid);
  }
}