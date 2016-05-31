export { default as Directory } from "./directory";
export { default as File } from "./file";
export { default as FileSystemRecord, FileSystemPermission } from "./file-system-record";

import * as del from "del";

export interface RemovePatternsOptions extends del.Options {
}

export function removePatternsAsync(patterns: string | string[], options?: RemovePatternsOptions): Promise<string[]> {
  return <Promise<string[]>>del(patterns, options);
}

export function removePatterns(patterns: string | string[], options?: RemovePatternsOptions): string[] {
  return <string[]><any>del.sync(patterns, options);
}