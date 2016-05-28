import { ChildProcess as NodeChildProcess, SpawnOptions as NodeSpawnOptions, spawn } from "child_process";

export interface SpawnOptions extends NodeSpawnOptions
{
  echo:boolean;
  log:boolean;
}

export class ChildProcess
{
  static spawnAsync(command:string, args?:string[], options?:SpawnOptions):Promise<NodeChildProcess> {
    if (options && options.echo)
      console.log(command + " " + args.join(" "));
    
    return new Promise<NodeChildProcess>((resolve, reject) => {
      let proc = spawn(command, args, options);
      proc.stdout.setEncoding("utf8");
      proc.stderr.setEncoding("utf8");
      if (options && options.log) {
        proc.stdout.on("data", (data:string) => console.log(data));
        proc.stderr.on("data", (data:string) => console.log(data.red));        
      }
      proc.on("exit", (code:number) => code == 0 ? resolve(proc) : reject(code));
    });
  }
}