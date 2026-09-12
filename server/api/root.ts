import { createTRPCRouter } from "@/server/api/trpc";
import { questionsRouter } from "@/server/api/routers/questions";
import { progressRouter } from "@/server/api/routers/progress";
import { healthRouter } from "@/server/api/routers/health";

export const appRouter = createTRPCRouter({
  questions: questionsRouter,
  progress: progressRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
