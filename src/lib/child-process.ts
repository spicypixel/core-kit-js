import { Promise } from "./promise";
import {
  ChildProcess as NodeChildProcess,
  SpawnOptions as NodeSpawnOptions,
  spawn
} from "child_process";

export interface SpawnOptions extends NodeSpawnOptions {
  echo?: boolean;
  log?: boolean;
}

export default class ChildProcess {
  static spawnAsync(command: string, args?: string[], options?: SpawnOptions): Promise<NodeChildProcess> {
    if (!args) args = [];
    let spawnCommandAndArgs = command + " " + args.join(" ");
    if (options && options.echo)
      console.log(spawnCommandAndArgs);

    return new Promise<NodeChildProcess>((resolve, reject) => {
      let failed: boolean = false;
      let proc = spawn(command, args, options);
      proc.stdout.setEncoding("utf8");
      proc.stderr.setEncoding("utf8");
      if (options && options.log) {
        proc.stdout.on("data", (data: string) => console.log(data));
        proc.stderr.on("data", (data: string) => console.log(data.red));
      }
      proc.on("error", (error: Error) => {
        failed = true;
        reject(error);
      });
      proc.on("exit", (code: number) => {
        if (code === 0)
          resolve(proc);
        else {
          if (!failed) {
            let error = new Error("Exit code = " + code + " for ...\n" + spawnCommandAndArgs);
            (<any>error).childProcess = proc;
            reject(error);
          }
        }
      });
    });
  }
}