import Bluebird from "../promise";
import { default as FileSystemRecord, FileSystemPermission } from "./file-system-record";
import * as fs from "fs-extra";
import * as walk from "walk";
import * as path from "path";
let fsp = <any>Bluebird.promisifyAll(fs);
import File from "./file";

export interface RemoveUnmatchedOptions {
  ignoreMissingSource?: boolean;
  ignoreMissingDestination?: boolean;
}

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

  /** Removes all directories in destination with no match in source. */
  static async removeUnmatchedAsync(src: string, dest: string, options?: RemoveUnmatchedOptions) {
    const walker = walk.walk(dest);
    const pathsToRemove: string[] = [];

    try {
      await Directory.accessAsync(src, FileSystemPermission.Visible);
    }
    catch (error) {
      if (!options || !options.ignoreMissingSource) {
        throw error;
      } else {
        return;
      }
    }

    try {
      await Directory.accessAsync(dest, FileSystemPermission.Visible);
    }
    catch (error) {
      if (!options || !options.ignoreMissingDestination) {
        throw error;
      } else {
        return;
      }
    }

    await new Promise((resolve, reject) => {
      walker.on("errors", (root: any, nodeStatsArray: any, next: any) => {
        reject(nodeStatsArray);
      });
      walker.on("end", () => {
        resolve();
      });
      walker.on("directory", async (root: string, stat: any, next: any) => {
        try {
          await Directory.accessAsync(path.join(src, path.relative(dest, root), stat.name), FileSystemPermission.Visible);
        }
        catch (error) {
          pathsToRemove.push(path.join(root, stat.name));
        }
        next();
      });
    });

    await Promise.all(pathsToRemove.map(async path => {
      await Directory.removeRecursiveAsync(path);
    }));
  }
}