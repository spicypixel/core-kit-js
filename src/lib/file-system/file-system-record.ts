import Promise from "../promise";
import * as fs from "fs";
import * as fsx from "fs-extra";
let fsp = <any>Promise.promisifyAll(fsx);

export enum FileSystemPermission {
  Visible = fs.F_OK,
  Read = fs.R_OK,
  Write = fs.W_OK,
  Execute = fs.X_OK
}

export default class FileSystemRecord {
  static accessAsync(path: string, mode?: FileSystemPermission): Promise<any> {
    return fsp.accessAsync(path, mode);
  }

  static chmodAsync(path: string, mode: string | number): Promise<any> {
    return fsp.chmodAsync(path, mode);
  }

  static chownAsync(path: string, uid: number, gid: number): Promise<any> {
    return fsp.chownAsync(path, uid, gid);
  }
}