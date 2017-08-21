export { default as Directory } from "./directory";
export { default as File } from "./file";
export { default as FileSystemRecord, FileSystemPermission } from "./file-system-record";

// import Promise from "../promise";
import * as del from "del";
import * as vfs from "vinyl-fs";

// import * as fsx from "fs-extra";
// let fsp: any = Promise.promisifyAll(fsx);

// import * as glob from "glob";
// let globp: any = Promise.promisify(glob);

// import * as ncp from "ncp";
// let ncpp: any = Promise.promisify(ncp.ncp);

import * as path from "path";

import * as gulp from "gulp";
import * as flatten from "gulp-flatten";
import * as gulpif from "gulp-if";

// Note that these Options interfaces are duplicated so consumers
// do not have to import typings for the base libraries.

export interface MinimatchOptions {
  /**
   * Dump a ton of stuff to stderr.
   */
  debug?: boolean;
  /**
   * Do not expand `{a,b}` and `{1..3}` brace sets.
   */
  nobrace?: boolean;
  /**
   * Disable `**` matching against multiple folder names.
   */
  noglobstar?: boolean;
  /**
   * Allow patterns to match filenames starting with a period, even if the pattern does not explicitly have a period in that spot.
   *
   * Note that by default, `a\/**\/b` will not match `a/.d/b`, unless `dot` is set.
   */
  dot?: boolean;
  /**
   * Disable "extglob" style patterns like `+(a|b)`.
   */
  noext?: boolean;
  /**
   * Perform a case-insensitive match.
   */
  nocase?: boolean;
  /**
   * When a match is not found by `minimatch.match`, return a list containing the pattern itself if this option is set. When not set, an empty list is returned if there are no matches.
   */
  nonull?: boolean;
  /**
   * If set, then patterns without slashes will be matched against the basename of the path if it contains slashes. For example, `a?b` would match the path `/xyz/123/acb`, but not `/xyz/acb/123`.
   */
  matchBase?: boolean;
  /**
   * Suppress the behavior of treating `#` at the start of a pattern as a comment.
   */
  nocomment?: boolean;
  /**
   * Suppress the behavior of treating a leading `!` character as negation.
   */
  nonegate?: boolean;
  /**
   * Returns from negate expressions the same as if they were not negated. (Ie, true on a hit, false on a miss.)
   */
  flipNegate?: boolean;
}

export interface GlobOptions extends MinimatchOptions {
  /**
   * The current working directory in which to search. Defaults to `process.cwd()`.
   */
  cwd?: string;
  /**
   * The place where patterns starting with `/` will be mounted onto. Defaults to `path.resolve(options.cwd, "/")` (`/` on Unix systems, and `C:\` or some such on Windows.)
   */
  root?: string;
  /**
   * Include `.dot` files in normal matches and `globstar` matches. Note that an explicit dot in a portion of the pattern will always match dot files.
   */
  dot?: boolean;
  /**
   * By default, a pattern starting with a forward-slash will be "mounted" onto the root setting, so that a valid filesystem path is returned. Set this flag to disable that behavior.
   */
  nomount?: boolean;
  /**
   * Add a `/` character to directory matches. Note that this requires additional stat calls.
   */
  mark?: boolean;
  /**
   * Don't sort the results.
   */
  nosort?: boolean;
  /**
   * Set to true to stat all results. This reduces performance somewhat, and is completely unnecessary, unless `readdir` is presumed to be an untrustworthy indicator of file existence.
   */
  stat?: boolean;
  /**
   * When an unusual error is encountered when attempting to read a directory, a warning will be printed to stderr. Set the `silent` option to true to suppress these warnings.
   */
  silent?: boolean;
  /**
   * When an unusual error is encountered when attempting to read a directory, the process will just continue on in search of other matches. Set the `strict` option to raise an error in these cases.
   */
  strict?: boolean;
  /**
   * See `cache` property above. Pass in a previously generated cache object to save some fs calls.
   */
  cache?: any;
  /**
   * A cache of results of filesystem information, to prevent unnecessary stat calls. While it should not normally be necessary to set this, you may pass the statCache from one glob() call to the options object of another, if you know that the filesystem will not change between calls. (See https://github.com/isaacs/node-glob#race-conditions)
   */
  statCache?: any;
  /**
   * A cache of known symbolic links. You may pass in a previously generated `symlinks` object to save lstat calls when resolving `**` matches.
   */
  symlinks?: any;
  /**
   * DEPRECATED: use `glob.sync(pattern, opts)` instead.
   */
  sync?: boolean;
  /**
   * In some cases, brace-expanded patterns can result in the same file showing up multiple times in the result set. By default, this implementation prevents duplicates in the result set. Set this flag to disable that behavior.
   */
  nounique?: boolean;
  /**
   * Set to never return an empty set, instead returning a set containing the pattern itself. This is the default in glob(3).
   */
  nonull?: boolean;
  /**
   * Set to enable debug logging in minimatch and glob.
   */
  debug?: boolean;
  /**
   * Do not expand `{a,b}` and `{1..3}` brace sets.
   */
  nobrace?: boolean;
  /**
   * Do not match `**` against multiple filenames. (Ie, treat it as a normal `*` instead.)
   */
  noglobstar?: boolean;
  /**
   * Do not match `+(a|b)` "extglob" patterns.
   */
  noext?: boolean;
  /**
   * Perform a case-insensitive match. Note: on case-insensitive filesystems, non-magic patterns will match by default, since `stat` and `readdir` will not raise errors.
   */
  nocase?: boolean;
  /**
   * Perform a basename-only match if the pattern does not contain any slash characters. That is, `*.js` would be treated as equivalent to `**\/*.js`, matching all js files in all directories.
   */
  matchBase?: any;
  /**
   * Do not match directories, only files. (Note: to match only directories, simply put a `/` at the end of the pattern.)
   */
  nodir?: boolean;
  /**
   * Add a pattern or an array of glob patterns to exclude matches. Note: `ignore` patterns are always in `dot:true` mode, regardless of any other settings.
   */
  ignore?: string | string[];
  /**
   * Follow symlinked directories when expanding `**` patterns. Note that this can result in a lot of duplicate references in the presence of cyclic links.
   */
  follow?: boolean;
  /**
   * Set to true to call `fs.realpath` on all of the results. In the case of a symlink that cannot be resolved, the full absolute path to the matched entry is returned (though it will usually be a broken symlink)
   */
  realpath?: boolean;
}

export interface RemovePatternsOptions extends GlobOptions {
  force?: boolean;
  dryRun?: boolean;
  concurrency?: number;
}

// export interface CopyPatternsOptions {
//   filter?: RegExp;
//   transform?: (read: NodeJS.ReadableStream, write: NodeJS.WritableStream) => void;
//   clobber?: boolean;
//   stopOnErr?: boolean;
//   errs?: NodeJS.WritableStream;
//   globOptions?: GlobOptions;
// }

/**
 * Options to pass to node-glob through glob-stream.
 * Specifies two options in addition to those used by node-glob:
 * https://github.com/isaacs/node-glob#options
 */
export interface CopyPatternsOptions extends vfs.SrcOptions {
    /**
     * Setting this to <code>false</code> will return <code>file.contents</code> as <code>null</code>
     * and not read the file at all.
     * Default: <code>true</code>.
     */
    read?: boolean;

    /**
     * Setting this to false will return <code>file.contents</code> as a stream and not buffer files.
     * This is useful when working with large files.
     * Note: Plugins might not implement support for streams.
     * Default: <code>true</code>.
     */
    buffer?: boolean;

    /**
     * The base path of a glob.
     *
     * Default is everything before a glob starts.
     */
    base?: string;

    /**
     * The current working directory in which to search.
     * Defaults to process.cwd().
     */
    cwd?: string;

    /**
     * The place where patterns starting with / will be mounted onto.
     * Defaults to path.resolve(options.cwd, "/") (/ on Unix systems, and C:\ or some such on Windows.)
     */
    root?: string;

    /**
     * Include .dot files in normal matches and globstar matches.
     * Note that an explicit dot in a portion of the pattern will always match dot files.
     */
    dot?: boolean;

    /**
     * By default, a pattern starting with a forward-slash will be "mounted" onto the root setting, so that a valid
     * filesystem path is returned. Set this flag to disable that behavior.
     */
    nomount?: boolean;

    /**
     * Add a / character to directory matches. Note that this requires additional stat calls.
     */
    mark?: boolean;

    /**
     * Don't sort the results.
     */
    nosort?: boolean;

    /**
     * Set to true to stat all results. This reduces performance somewhat, and is completely unnecessary, unless
     * readdir is presumed to be an untrustworthy indicator of file existence. It will cause ELOOP to be triggered one
     * level sooner in the case of cyclical symbolic links.
     */
    stat?: boolean;

    /**
     * When an unusual error is encountered when attempting to read a directory, a warning will be printed to stderr.
     * Set the silent option to true to suppress these warnings.
     */
    silent?: boolean;

    /**
     * When an unusual error is encountered when attempting to read a directory, the process will just continue on in
     * search of other matches. Set the strict option to raise an error in these cases.
     */
    strict?: boolean;

    /**
     * See cache property above. Pass in a previously generated cache object to save some fs calls.
     */
    // cache?: boolean;

    /**
     * A cache of results of filesystem information, to prevent unnecessary stat calls.
     * While it should not normally be necessary to set this, you may pass the statCache from one glob() call to the
     * options object of another, if you know that the filesystem will not change between calls.
     */
    // statCache?: boolean;

    /**
     * Perform a synchronous glob search.
     */
    sync?: boolean;

    /**
     * In some cases, brace-expanded patterns can result in the same file showing up multiple times in the result set.
     * By default, this implementation prevents duplicates in the result set. Set this flag to disable that behavior.
     */
    nounique?: boolean;

    /**
     * Set to never return an empty set, instead returning a set containing the pattern itself.
     * This is the default in glob(3).
     */
    nonull?: boolean;

    /**
     * Perform a case-insensitive match. Note that case-insensitive filesystems will sometimes result in glob returning
     * results that are case-insensitively matched anyway, since readdir and stat will not raise an error.
     */
    nocase?: boolean;

    /**
     * Set to enable debug logging in minimatch and glob.
     */
    debug?: boolean;

    /**
     * Set to enable debug logging in glob, but not minimatch.
     */
    globDebug?: boolean;

    /**
     * Octal permission string specifying mode for any folders that need to be created for output folder.
     * Default: 0777.
     */
    mode?: string;

    flatten?: boolean;
}

export async function copyPatternsAsync(sourcePatterns: string | string[], destination: string, options?: CopyPatternsOptions): Promise<void> {
  // if (!options) options = {};
  // if (!options.stopOnErr) options.stopOnErr = true;

  // Using path.basename will result in a flatten when multiple
  // source directories are specified. Another option would be
  // to find the common base and create the relative subfolders.
  // let matches: string[] = await globp(sourcePatterns, options.globOptions);
  // for (let i = 0; i < matches.length; ++i) {
  //   let match = matches[i];
  //   await ncpp(match, path.join(destination, path.basename(match)), options);
  // }
  return new Promise<void>((resolve, reject) => {
    let destinationOptions: vfs.DestOptions;
    if (options && options.mode)
      destinationOptions = { mode: options.mode };

    gulp
      .src(sourcePatterns, options)
      .pipe(gulpif(options && options.flatten, flatten()))
      .pipe(gulp.dest(destination, destinationOptions))
      .on("end", resolve)
      .on("error", reject);
  });
}

export async function removePatternsAsync(patterns: string | string[], options?: RemovePatternsOptions): Promise<string[]> {
  return await del(patterns, options);
}

export function removePatterns(patterns: string | string[], options?: RemovePatternsOptions): string[] {
  return del.sync(patterns, options);
}