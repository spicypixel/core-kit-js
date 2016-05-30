export interface PlatformInformation {
  isWin: boolean;
  isMac: boolean;
  is64Bit: boolean;
}

export class Platform {
  get info(): PlatformInformation {
    return {
      isWin: /^win/.test(process.platform),
      isMac: /^darwin/.test(process.platform),
      is64Bit: (process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432"))
    };
  }
}