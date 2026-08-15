/* Field Notes Arcade: authorised question imports are validated before they can enter a distinct source ledger. */

import { z } from "zod";

const subjectSchema = z.enum(["Use of English", "Biology", "Chemistry", "Physics"]);

export const authorisedQuestionSchema = z.object({
  externalId: z.string().trim().min(1).max(128),
  subject: subjectSchema,
  topic: z.string().trim().min(1).max(160),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  question: z.string().trim().min(8).max(8_000),
  options: z.array(z.string().trim().min(1).max(1_000)).min(4).max(5),
  answerIndex: z.number().int().min(0),
  explanation: z.string().trim().max(4_000).optional(),
});

export const authorisedImportSchema = z.object({
  sourceLabel: z.string().trim().min(3).max(120),
  permissionNote: z.string().trim().min(8).max(2_000),
  fileName: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(512),
  questions: z.array(authorisedQuestionSchema).min(1).max(500),
}).superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.questions.forEach((question, index) => {
    const key = question.externalId.toLowerCase();
    if (seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", index, "externalId"],
        message: "Each authorised question must have a unique externalId within this import.",
      });
    }
    seen.add(key);
    if (question.answerIndex >= question.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["questions", index, "answerIndex"],
        message: "The answer index must point to one of the supplied four or five options.",
      });
    }
  });
});

export type AuthorisedQuestionImport = z.infer<typeof authorisedImportSchema>;
