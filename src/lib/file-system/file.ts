import Bluebird from "../promise";
import FileSystemRecord from "./file-system-record";
import * as fs from "fs-extra";
let fsp = <any>Bluebird.promisifyAll(fs);

export interface ReadFileOptions {
  encoding: string | null;
  flag: string;
}

export interface WriteFileOptions {
  encoding: string | null;
  mode: number;
  flag: string;
}

export default class File extends FileSystemRecord {
  static copyAsync(src: string, dest: string): Promise<void> {
    return fsp.copyAsync(src, dest);
  }

  static removeAsync(path: string): Promise<void> {
    return fsp.unlinkAsync(path);
  }

  static readFileAsync(path: string | Buffer | URL | number, options?: ReadFileOptions | string): Promise<object> {
    return fsp.readFileAsync(path, options);
  }

  static writeFileAsync(file: string | Buffer | URL | number, data: string | Buffer | Uint8Array, options?: WriteFileOptions | string) {
    return fsp.writeFileAsync(file, data, options);
  }
}