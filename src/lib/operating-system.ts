import * as os from "os";

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

export class OperatingSystem {
  static eol = os.EOL;

  static get architecture(): Architecture {
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

  static get cpus(): CpuDetails[] {
    return <CpuDetails[]>os.cpus();
  }

  static get endianness(): Endianness {
    if (os.endianness() === "BE")
      return Endianness.Big;

    return Endianness.Little;
  }

  static get freeMemory(): number {
    return os.freemem();
  }

  static get homeDirectory(): string {
    return os.homedir();
  }

  static get hostName(): string {
    return os.hostname();
  }

  static get loadAverages(): number[] {
    return os.loadavg();
  }

  static get networkInterfaces(): { [index: string]: NetworkInterfaceDetails[] } {
    return <{ [index: string]: NetworkInterfaceDetails[] }>os.networkInterfaces();
  }

  static get platform(): Platform {
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

  static get release(): string {
    return os.release();
  }

  static get tempDirectory(): string {
    return os.tmpdir();
  }

  static get totalMemory(): number {
    return os.totalmem();
  }

  static get uptimeSeconds(): number {
    return os.uptime();
  }

  static get user(): UserDetails {
    return this.getUser();
  }

  static getUser(options?: UserOptions): UserDetails {
    return <UserDetails>(<any>os).userInfo(options);
  }
}