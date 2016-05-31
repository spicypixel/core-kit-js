import LaunchArguments from "./launch-arguments";

export enum BuildErrorLevel {
  Off,
  Warning,
  Error
}

// Command line option:
//  --fatal=[warning|error|off]
const fatalLevelArgument: string = (<any>LaunchArguments.argv).fatal;

export default class BuildErrorHandler {
  private static isFatal(level: BuildErrorLevel): boolean {
    let fatalLevel: BuildErrorLevel;
    switch (fatalLevelArgument) {
      case "error":
        fatalLevel = BuildErrorLevel.Error;
        break;
      case "warning":
        fatalLevel = BuildErrorLevel.Warning;
        break;
      case "off":
        return false;
      default:
        fatalLevel = BuildErrorLevel.Error;
        break;
    }

    return fatalLevel <= level;
  }

  static setCustomHandler(handler: (level: BuildErrorLevel, error: Error) => void) {
    BuildErrorHandler.handleError = handler;
  }

  private static handleError(level: BuildErrorLevel, error: Error): void {
    if (BuildErrorHandler.isFatal(level)) {
      process.exit(1);
    }
    else {
      console.log(error.message);
    }
  }

  static onError(error: Error): void {
    BuildErrorHandler.handleError(BuildErrorLevel.Error, error);
  }

  static onWarning(error: Error): void {
    BuildErrorHandler.handleError(BuildErrorLevel.Warning, error);
  }
}