import { publicProcedure, createTRPCRouter } from "./trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { questions } from "@/server/db/schema";

export const questionsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        subject: z.string().optional(),
        topic: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // TODO: Implement with proper database query
        // const result = await db.select().from(questions).limit(input.limit).offset(input.offset);
        return {
          questions: [],
          total: 0,
        };
      } catch (error) {
        throw new Error("Failed to fetch questions");
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        // TODO: Implement with proper database query
        return null;
      } catch (error) {
        throw new Error("Failed to fetch question");
      }
    }),

  getBySubject: publicProcedure
    .input(
      z.object({
        subject: z.string(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        // TODO: Implement with proper database query
        return {
          questions: [],
          total: 0,
        };
      } catch (error) {
        throw new Error("Failed to fetch questions by subject");
      }
    }),

  create: publicProcedure
    .input(
      z.object({
        subject: z.string(),
        topic: z.string(),
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
        explanation: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement with proper database insertion
        return { success: true, id: 0 };
      } catch (error) {
        throw new Error("Failed to create question");
      }
    }),
});
