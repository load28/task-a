import { openSync,writeFileSync,fsyncSync,closeSync,renameSync,unlinkSync } from "node:fs"
import { dirname,join } from "node:path"
import { randomUUID } from "node:crypto"

/** Persist bytes before exposing the name, then persist the containing directory. */
export function durableReplace(path:string,content:string,mode=0o600):void {
  const temporary=join(dirname(path),`.task-write-${randomUUID()}`)
  let file:number|undefined
  try {
    file=openSync(temporary,"wx",mode)
    writeFileSync(file,content);fsyncSync(file);closeSync(file);file=undefined
    renameSync(temporary,path)
    const directory=openSync(dirname(path),"r")
    try{fsyncSync(directory)}finally{closeSync(directory)}
  }finally {
    if(file!==undefined)closeSync(file)
    try{unlinkSync(temporary)}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}
  }
}
