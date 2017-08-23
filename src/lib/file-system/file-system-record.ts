import Bluebird from "../promise";
import * as del from "del";
import * as fs from "fs";
import * as fsx from "fs-extra";
let fsp = <any>Bluebird.promisifyAll(fsx);

export enum FileSystemPermission {
  Visible = fs.constants.F_OK,
  Read = fs.constants.R_OK,
  Write = fs.constants.W_OK,
  Execute = fs.constants.X_OK
}

export default class FileSystemRecord {
  static accessAsync(path: string, mode?: FileSystemPermission): Promise<void> {
    return fsp.accessAsync(path, mode);
  }

  static chmodAsync(path: string, mode: string | number): Promise<void> {
    return fsp.chmodAsync(path, mode);
  }

  static chownAsync(path: string, uid: number, gid: number): Promise<void> {
    return fsp.chownAsync(path, uid, gid);
  }
}