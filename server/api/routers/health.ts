import { publicProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";

export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }),

  ping: publicProcedure.mutation(async () => {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
    };
  }),
});
