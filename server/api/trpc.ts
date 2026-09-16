import { sdk } from "../_core/sdk";

export {
  router as createTRPCRouter,
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../_core/trpc";

/** Adapt a Web Request to the legacy server context used by the production router. */
export async function createTRPCContext({ req }: { req: Request }) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(req as never);
  } catch {
    // Authentication is optional for public procedures; protected procedures
    // raise the normal tRPC UNAUTHORIZED error when user is absent.
  }
  return {
    req: req as never,
    // The legacy logout procedure expects Express' clearCookie API. Fetch
    // handlers cannot mutate an Express response, so keep this compatibility
    // shim; protected procedures still enforce authentication.
    res: { clearCookie: () => undefined } as never,
    user,
  };
}
