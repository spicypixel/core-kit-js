import { Promise } from "./promise";
import * as fs from "fs-extra";

export class File {
  static chmodAsync(path: string, mode: string | number): Promise<any> {
    let chmod = <(path: string, mode: string | number) => Promise<any>><any>Promise.promisify(fs.chmod);
    return chmod(path, mode);
  }

  static removeAsync(path: string): Promise<any> {
    let remove = Promise.promisify(fs.remove);
    return remove(path);
  }
}