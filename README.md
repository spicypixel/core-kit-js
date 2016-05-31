Spicy Pixel Core Kit for JavaScript
===================================
**What:** This developer kit contains core modules for the Spicy Pixel JavaScript Framework-- a foundation for building apps, libraries, and middleware.

**Why:** Built-in APIs from Node.js and web browsers need a little love to be developer friendly. Some designs are archaic and the platforms have gaps that get filled by dozens of modules from different vendors. The goal of the Core Kit is to unify common dependencies under a modern framework.  

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
import { ArrayBufferConverter } from "../lib/array-buffer-converter";

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

### operating-system

The operating system module provides an abstraction for obtaining information about the current platform and user. A default implementation wraps the built-in Node.js "os" module. Convenient enums are provided for common values.

#### Sample

```javascript
import { OperatingSystemProvider, Architecture } from "../lib/operating-system";

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