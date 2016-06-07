Spicy Pixel Core Kit JS
=======================
**What:** This developer kit contains core modules for the Spicy Pixel JavaScript Framework, a foundation for building apps, libraries, and middleware.

**Why:** Some built-in APIs from Node.js and web browsers need a little love to be developer friendly and the base platforms have gaps that get filled by dozens of modules from different vendors. The goal of the Core Kit is to unify common dependencies under a modern framework.

**How:** The kit wraps key modules from Node.js and other dependencies into more modern interfaces that favor object-oriented design principles and newer language features like asynchronous promises.

The framework strives to provide abstractions that work in a variety of JavaScript environments, including web browsers and Node.js. In some cases, platform specific providers will specialize an interface to a given execution environment.

Features
--------

 * File system libraries
 * Child process execution
 * OS details (platform, architecture, cpus, memory)
 * Data encoding (media type, data url, array buffer conversion)
 * Build script error / warning framework
 * Promise contracts that support async/await
 * TypeScript ambient declarations for strong types

Modules
-------

### array-buffer-converter

Convert array buffers to and from base64 and binary strings.

#### Sample

```javascript
import { ArrayBufferConverter } from "@spicypixel/core-kit-js";

describe("ArrayBufferConverter", () => {
  it("should convert", () => {
    let testString = "Test";

    let arrayBuffer = ArrayBufferConverter.fromBinaryString(testString);
    arrayBuffer.byteLength.should.equal(4);

    let binaryString = ArrayBufferConverter.toBinaryString(arrayBuffer);
    binaryString.should.equal(testString);

    let base64 = ArrayBufferConverter.toBase64(arrayBuffer);
    base64.should.equal("VGVzdA==");

    let arrayBufferFromBase64 = ArrayBufferConverter.fromBase64(base64);
    equal(arrayBuffer, arrayBufferFromBase64).should.be.true;

    let decodedBase64 = ArrayBufferConverter.toBinaryString(arrayBufferFromBase64);
    decodedBase64.should.equal(testString);
  });
});
```

#### API

Standalone

```javascript
export declare class ArrayBufferConverter {
    static toBase64(arrayBuffer: ArrayBuffer): string;
    static fromBase64(base64: string): ArrayBuffer;
    static toBinaryString(arrayBuffer: ArrayBuffer): string;
    static fromBinaryString(binary: string): ArrayBuffer;
}
```

Extensions

```javascript
interface ArrayBufferConstructor {
  fromBase64(base64: string): ArrayBuffer;
  fromBinaryString(binaryString: string): ArrayBuffer;
}

interface ArrayBuffer {
  toBase64(): string;
  toBinaryString(): string;
}
```

### child-process

The child process module provides a convenient way to spawn a process and wait for its completion.

#### Sample

```javascript
static async doxygenAsync(): Promise<void> {
  await ChildProcess.spawnAsync("doxygen", [], { log: true });
}
```

#### API

```javascript
export interface SpawnOptions extends NodeSpawnOptions {
    echo?: boolean;
    log?: boolean;
}

export default class ChildProcess {
    static spawnAsync(command: string, args?: string[], options?: SpawnOptions): Promise<NodeChildProcess>;
}
```

### data-url

The data URL module makes it easy to create and consume [Data URLs](https://en.wikipedia.org/wiki/Data_URI_scheme).

```javascript
export default class DataURL {
    constructor(data: any, options?: any);
    mediaType: MediaType;
    isBase64: boolean;
    data: string;
    setBase64EncodedData(base64EncodedData: string): void;
    setURLEncodedData(urlEncodedData: string): void;
    toString(): string;
    toJSON(): string;
    valueOf(): string;
    toArrayBuffer(): ArrayBuffer;
    toBase64(): string;
    toBinaryString(): string;
    toUnicodeString(): string;
    static createFromBase64(base64: string, options?: any): DataURL;
    static createFromBinaryString(binary: string, options?: any): DataURL;
    static createFromUnicodeString(text: string, options?: any): DataURL;
}
```

### file-system

The file system module wraps the Node.Js "fs" module in a more object-oriented way and adds support for globs (patterns), recrusive operations, and promises. Key types include File, Directory, FileSystemRecord, and the FileSystem module itself.

```javascript
export declare enum FileSystemPermission {
    Visible,
    Read,
    Write,
    Execute,
}

export default class FileSystemRecord {
    static accessAsync(path: string, mode?: FileSystemPermission): Promise<void>;
    static chmodAsync(path: string, mode: string | number): Promise<void>;
    static chownAsync(path: string, uid: number, gid: number): Promise<void>;
}

export default class File extends FileSystemRecord {
    static copyAsync(src: string, dest: string): Promise<void>;
    static removeAsync(path: string): Promise<void>;
}

export default class Directory extends FileSystemRecord {
    static createAsync(path: string): Promise<void>;
    static createRecursiveAsync(path: string): Promise<void>;
    static copyAsync(src: string, dest: string): Promise<void>;
    static removeAsync(path: string): Promise<void>;
    static removeRecursiveAsync(path: string): Promise<void>;
}

export declare function copyPatternsAsync(
    sourcePatterns: string | string[], destination: string,
    options?: CopyPatternsOptions): Promise<void>;

export declare function removePatternsAsync(
    patterns: string | string[],
    options?: RemovePatternsOptions): Promise<string[]>;

export declare function removePatterns(
    patterns: string | string[],
    options?: RemovePatternsOptions): string[];
```

### launch-arguments

The launch arguments module is a re-export of [yargs](https://www.npmjs.com/package/yargs) which makes it easy to write console applications or access command-line arguments.

```javascript
import { LaunchArguments } from "@spicypixel/core-kit-js";

// Command line option:
//  --fatal=[warning|error|off]
const fatal = LaunchArguments.argv.fatal;
```

### media-type

The media type module is a convenient way to create and consume media type strings.

```javascript
export default class MediaType {
    constructor(mediaType?: string);
    type: string;
    subtype: string;
    parameters: any;
    isValid: boolean;
    hasSuffix: boolean;
    isVendor: boolean;
    isPersonal: boolean;
    isExperimental: boolean;
    toString(): string;
    toJSON(): string;
    valueOf(): string;
}
```

### operating-system

The operating system module provides an abstraction for obtaining information about the current platform and user. A default implementation wraps the built-in Node.js "os" module. Convenient enums are provided for common values.

#### Sample

```javascript
import { OperatingSystemProvider, Architecture } from "@spicypixel/core-kit-js";

let os = OperatingSystemProvider.default;
if (os.architecture == Architecture.X64) {
  // do something special on x64
}
```

#### API

```javascript
export declare enum Architecture {
    X64 = 0,
    IA32 = 1,
    ARM = 2,
    Other = 3,
}

export declare enum Platform {
    Darwin = 0,
    FreeBSD = 1,
    Linux = 2,
    SunOS = 3,
    Win32 = 4,
    Other = 5,
}

export declare enum Endianness {
    Big = 0,
    Little = 1,
}

export interface CpuDetails {
    model: string;
    speed: number;
    times: {
        user: number;
        nice: number;
        sys: number;
        idle: number;
        irq: number;
    };
}

export interface NetworkInterfaceDetails {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
}

export interface UserDetails {
    username: string | Buffer;
    uid: number;
    gid: number;
    shell: string | Buffer;
    homedir: string | Buffer;
}

export interface UserOptions {
    encoding?: string;
}

export interface OperatingSystem {
    eol: string;
    architecture: Architecture;
    cpus: CpuDetails[];
    endianness: Endianness;
    freeMemory: number;
    homeDirectory: string;
    hostName: string;
    loadAverages: number[];
    networkInterfaces: {
        [index: string]: NetworkInterfaceDetails[];
    };
    platform: Platform;
    release: string;
    tempDirectory: string;
    totalMemory: number;
    uptimeSeconds: number;
    user: UserDetails;
    getUser(options?: UserOptions): UserDetails;
}

export declare class OperatingSystemProvider {
    static default: OperatingSystem;
}
```

### promise

Promise is a re-export of [bluebird](http://bluebirdjs.com/).