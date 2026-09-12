import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
});

export { handler as GET, handler as POST };
