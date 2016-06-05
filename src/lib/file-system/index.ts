export { default as Directory } from "./directory";
export { default as File } from "./file";
export { default as FileSystemRecord, FileSystemPermission } from "./file-system-record";

import Promise from "../promise";
import * as del from "del";
// let del = require("del");

import * as fsx from "fs-extra";
let fsp: any = Promise.promisifyAll(fsx);

import * as glob from "glob";
let globp: any = Promise.promisify(glob);

import * as ncp from "ncp";
let ncpp: any = Promise.promisify(ncp.ncp);

import * as path from "path";

export interface RemovePatternsOptions {
  force?: boolean;
  dryRun?: boolean;
  globOptions?: glob.Options;
}

export interface CopyPatternsOptions {
  filter?: RegExp;
  transform?: (read: NodeJS.ReadableStream, write: NodeJS.WritableStream) => void;
  clobber?: boolean;
  stopOnErr?: boolean;
  errs?: NodeJS.WritableStream;
  globOptions?: glob.Options;
}

export async function copyPatternsAsync(sourcePatterns: string | string[], destination: string, options?: CopyPatternsOptions): Promise<void> {
  if (!options) options = {};
  if (!options.stopOnErr) options.stopOnErr = true;

  let matches: string[] = await globp(sourcePatterns, options.globOptions);
  for (let i = 0; i < matches.length; ++i) {
    let match = matches[i];
    await ncpp(match, path.join(destination, path.basename(match)), options);
  }
}

export async function removePatternsAsync(patterns: string | string[], options?: RemovePatternsOptions): Promise<string[]> {
  if (!options) options = {};
  (<any>options).options = options.globOptions;

  let removed: string[];
  try {
    removed = await <Promise<string[]>>del(patterns, options);
  }
  finally {
    delete (<any>options).options;
  }
  return Promise.resolve(removed);
}

export function removePatterns(patterns: string | string[], options?: RemovePatternsOptions): string[] {
  if (!options) options = {};
  (<any>options).options = options.globOptions;
  let removed: string[];
  try {
    removed = <string[]><any>del.sync(patterns, options);
  }
  finally {
    delete (<any>options).options;
  }
  return removed;
}