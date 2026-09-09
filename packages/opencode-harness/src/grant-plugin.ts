import { AuthorityHttpClient, type AuthorityBinding } from "../../task-control/src/authority-http.ts"
import { grantHooks } from "./grant-hooks.ts"

/** Loaded by OpenCode from an explicit file URL, with a controller-held credential. */
export default async function plugin(_input:unknown,options?:Record<string,unknown>) {
  const authority=new AuthorityHttpClient(options as unknown as AuthorityBinding)
  return grantHooks(authority)
}
