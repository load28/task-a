import { AuthorityHttpClient,type AuthorityBinding } from "./authority-http.ts"
export class PodClient extends AuthorityHttpClient {
  readonly endpoint:AuthorityBinding
  constructor(binding:AuthorityBinding){super(binding);this.endpoint=binding}
  async request<T>(path:string,input:object={}):Promise<T> {
    const response=await fetch(new URL(path,this.endpoint.url),{method:"POST",redirect:"error",signal:AbortSignal.timeout(10000),headers:{authorization:`Bearer ${this.endpoint.token}`,"content-type":"application/json"},body:JSON.stringify(input)})
    const body=await response.json() as {result:T;error?:string}
    if(!response.ok)throw new Error(body.error??"Pod authority unavailable")
    return body.result
  }
}
