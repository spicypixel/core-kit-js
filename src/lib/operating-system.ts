import * as os from "os";

export enum Architecture {
  X64,
  IA32,
  ARM,
  Other
}

export enum Platform {
  Darwin,
  FreeBSD,
  Linux,
  SunOS,
  Win32,
  Other
}

export enum Endianness {
  Big,
  Little
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

export class OperatingSystemProvider {
  private static _instance: OperatingSystem;

  static get default(): OperatingSystem {
    if (!OperatingSystemProvider._instance) {
      if (process) { // process == node, window == browser
        OperatingSystemProvider._instance = new NodeOperatingSystem();
      }
    }

    return OperatingSystemProvider._instance;
  }
}

class NodeOperatingSystem implements OperatingSystem {
  eol = os.EOL;

  get architecture(): Architecture {
    switch (os.arch()) {
      case "x64":
        return Architecture.X64;
      case "ia32":
        return Architecture.IA32;
      case "arm":
        return Architecture.ARM;
      default:
        return Architecture.Other;
    }
  }

  get cpus(): CpuDetails[] {
    return <CpuDetails[]>os.cpus();
  }

  get endianness(): Endianness {
    if (os.endianness() === "BE")
      return Endianness.Big;

    return Endianness.Little;
  }

  get freeMemory(): number {
    return os.freemem();
  }

  get homeDirectory(): string {
    return os.homedir();
  }

  get hostName(): string {
    return os.hostname();
  }

  get loadAverages(): number[] {
    return os.loadavg();
  }

  get networkInterfaces(): { [index: string]: NetworkInterfaceDetails[] } {
    return <{ [index: string]: NetworkInterfaceDetails[] }>os.networkInterfaces();
  }

  get platform(): Platform {
    switch (os.platform()) {
      case "darwin":
        return Platform.Darwin;
      case "freebsd":
        return Platform.FreeBSD;
      case "linux":
        return Platform.Linux;
      case "sunos":
        return Platform.SunOS;
      case "win32":
        return Platform.Win32;
      default:
        return Platform.Other;
    }
  }

  get release(): string {
    return os.release();
  }

  get tempDirectory(): string {
    return os.tmpdir();
  }

  get totalMemory(): number {
    return os.totalmem();
  }

  get uptimeSeconds(): number {
    return os.uptime();
  }

  get user(): UserDetails {
    return this.getUser();
  }

  getUser(options?: UserOptions): UserDetails {
    return <UserDetails>(<any>os).userInfo(options);
  }
}