import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
/** Per-request delivery metadata only; no addresses, messages or credentials. */
export const authEmailDelivery = new AsyncLocalStorage<{
  attempted: boolean;
  accepted: boolean;
  failed: boolean;
}>();
