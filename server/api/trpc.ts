import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

interface CreateContextOptions {
  req?: Request;
}

export const createTRPCContext = (opts: CreateContextOptions) => {
  return {
    req: opts.req,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
