import { existsSync,mkdtempSync,realpathSync,rmSync,statSync } from "node:fs"
import { dirname,join,isAbsolute,relative } from "node:path"
import { tmpdir } from "node:os"
import { digest } from "../../task-control/src/value.ts"

export interface SandboxReceipt {kind:"macos-seatbelt"|"linux-bubblewrap"|"isolated-pod";network:false;workspaceReadOnly:true;profileHash?:string}

/** This is selected by the execution adapter, never by the proposed command. */
export function nativeSandbox(command:string[],root:string,cwd:string,environment:Record<string,string>,runtimeReadPaths:string[]=[]) {
  if(process.platform==="linux") {
    const bwrap=["/usr/bin/bwrap","/bin/bwrap"].find(existsSync)
    if(!bwrap)throw new Error("Native Linux validator isolation requires bubblewrap; use the isolated Pod adapter")
    return linuxBubblewrap(command,root,cwd,environment,runtimeReadPaths,bwrap)
  }
  if(process.platform!=="darwin"||!existsSync("/usr/bin/sandbox-exec"))throw new Error("Native validator isolation is unavailable; use the isolated Pod adapter")
  if(!isAbsolute(command[0]!))throw new Error("An isolated native validator requires an absolute executable path")
  const executable=realpathSync(command[0]!)
  if(!statSync(executable).isFile())throw new Error("Validator executable is not a regular file")
  const scratch=realpathSync(mkdtempSync(join(tmpdir(),"task-validator-")))
  try {
    const literal=(value:string)=>JSON.stringify(value)
    // getcwd traverses parent directories with file-read-data on macOS. Grant
    // only directory entries, never the contents of their sibling files.
    const ancestors=new Set<string>()
    for(const start of [cwd,dirname(executable),scratch])for(let parent=dirname(start);;parent=dirname(parent)){
      ancestors.add(parent);if(parent===dirname(parent))break
    }
    const paths=runtimeReadPaths.map(path=>{if(!isAbsolute(path))throw new Error("Runtime reads must be explicit absolute paths");return realpathSync(path)})
    // A detached descendant could escape a host process-group timeout. Native
    // validation therefore admits one process; multiprocess builds use a Pod.
    const profile=["(version 1)","(deny default)","(allow process-exec)",
      `(allow sysctl-read ${["kern.osrelease","kern.ostype","kern.osversion","hw.machine","hw.model","hw.memsize","hw.pagesize","hw.pagesize_compat","hw.ncpu","hw.activecpu","hw.logicalcpu","hw.logicalcpu_max","hw.physicalcpu","hw.physicalcpu_max","hw.optional.arm64"].map(name=>`(sysctl-name ${literal(name)})`).join(" ")})`,
      "(allow file-read-metadata)",
      `(allow file-read* ${[...ancestors].map(path=>`(literal ${literal(path)})`).join(" ")})`,
      `(allow file-read* (subpath "/System") (subpath "/usr/lib") (subpath "/usr/share") (subpath "/usr/bin") (subpath "/bin") (literal "/dev/null") (literal "/dev/random") (literal "/dev/urandom") (literal ${literal(executable)}) (subpath ${literal(root)}) ${paths.map(path=>`(${statSync(path).isDirectory()?"subpath":"literal"} ${literal(path)})`).join(" ")})`,
      `(allow file-read* file-write* (subpath ${literal(scratch)}))`,
      '(allow file-write* (literal "/dev/null"))',
    ].join("\n")
    return {command:["/usr/bin/sandbox-exec","-p",profile,executable,...command.slice(1)],environment:{...environment,HOME:scratch,TMPDIR:scratch,TMP:scratch,TEMP:scratch},receipt:{kind:"macos-seatbelt",network:false,workspaceReadOnly:true,profileHash:digest(profile)} satisfies SandboxReceipt,close:()=>rmSync(scratch,{recursive:true,force:true})}
  }catch(error){rmSync(scratch,{recursive:true,force:true});throw error}
}

/** Linux uses new user, mount, network and PID namespaces with an explicit
 * read surface. The host root is never mounted. */
export function linuxBubblewrap(command:string[],root:string,cwd:string,environment:Record<string,string>,runtimeReadPaths:string[]=[],bwrap="/usr/bin/bwrap") {
  if(!isAbsolute(bwrap)||!isAbsolute(command[0]!))throw new Error("Linux isolation requires absolute executables")
  const executable=realpathSync(command[0]!)
  if(!statSync(executable).isFile())throw new Error("Validator executable is not a regular file")
  const scratch=realpathSync(mkdtempSync(join(tmpdir(),"task-validator-")))
  try {
    const workspace=realpathSync(root),workingDirectory=realpathSync(cwd),fromWorkspace=relative(workspace,workingDirectory)
    if(fromWorkspace.startsWith("..")||isAbsolute(fromWorkspace))throw new Error("Validator cwd must stay inside the workspace")
    const runtime=runtimeReadPaths.map(path=>{if(!isAbsolute(path))throw new Error("Runtime reads must be explicit absolute paths");return realpathSync(path)})
    const system=["/usr","/bin","/lib","/lib64","/etc/ld.so.cache","/etc/ssl/certs"].filter(existsSync)
    const reads=[...new Set([...system,dirname(executable),workspace,...runtime])]
    const args=["--die-with-parent","--new-session","--unshare-all","--proc","/proc","--dev","/dev","--tmpfs","/tmp"]
    for(const path of reads)args.push("--ro-bind",path,path)
    args.push("--bind",scratch,scratch,"--chdir",workingDirectory,"--setenv","HOME",scratch,"--setenv","TMPDIR",scratch,"--setenv","TMP",scratch,"--setenv","TEMP",scratch,"--",executable,...command.slice(1))
    return {command:[bwrap,...args],environment,receipt:{kind:"linux-bubblewrap",network:false,workspaceReadOnly:true,profileHash:digest({bwrap,args})} satisfies SandboxReceipt,close:()=>rmSync(scratch,{recursive:true,force:true})}
  }catch(error){rmSync(scratch,{recursive:true,force:true});throw error}
}
