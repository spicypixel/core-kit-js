Spicy Pixel Core Kit for JavaScript
===================================
This developer kit contains core modules for the Spicy Pixel JavaScript Framework.

Features
--------

 * File system libraries
 * Child process execution
 * OS details (platform, architecture, cpus, memory)
 * Data encoding (media type, data url, array buffer conversion)
 * Build script error / warning framework 
 * All async operations use promise contracts that support async/await
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

```ts
export declare class ArrayBufferConverter {
    static toBase64(arrayBuffer: ArrayBuffer): string;
    static fromBase64(base64: string): ArrayBuffer;
    static toBinaryString(arrayBuffer: ArrayBuffer): string;
    static fromBinaryString(binary: string): ArrayBuffer;
}
```

### operating-system

The operating system module provides an abstraction for obtaining information about the current platform and user. A default implementation wraps the built-in NodeJS "os" module. Convenient enums are provided for common values.

#### Sample

```javascript
import { OperatingSystemProvider, Architecture } from "../lib/operating-system";

let os = OperatingSystemProvider.default;
if (os.architecture == Architecture.X64) {
  // do something special on x64
}
```

#### API

```typescript
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