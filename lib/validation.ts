/**
 * Validation schemas using Zod
 */
import { z } from "zod";

export const questionSchema = z.object({
  id: z.number(),
  subject: z.string(),
  topic: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const userProgressSchema = z.object({
  userId: z.number(),
  questionId: z.number(),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  timeSpent: z.number(),
});

export const quizResultSchema = z.object({
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  timeSpent: z.number(),
  subject: z.string(),
});

export type Question = z.infer<typeof questionSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;
export type QuizResult = z.infer<typeof quizResultSchema>;
