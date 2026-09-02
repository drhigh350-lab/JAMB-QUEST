/* Field Notes Arcade: authenticated procedures keep each learner’s revision ledger private and useful. */

import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {   confirmProviderEnrollment, createPublicChallenge, disablePushSubscriptions, getLearnerCbtHistory, getLearnerDashboard, getLearnerQuestionReportReceipts, getLearnerRoundReview, getOneSignalAppId, getOwnerApprovedQuestionReviewPage, getOwnerApprovedQuestionReviewSummary, getOwnerDiagramAuditPage, getOwnerQuestionCorrectionHistory, getOwnerHeldDiagramRecords, getOwnerQuestionReports, getPlayableAuthorisedQuestions, updateOwnerApprovedQuestion, getPublicChallenge, getPublicChallengeLeaderboard, getArenaDiscoverChallenges, getQuestionSourceCatalogue, getWebPushPublicKey, importAuthorisedQuestionSet, learnerQuestionReportStatuses, recordLearnerRound, refreshProviderScheduledReminders, reportLearnerQuestion, sendLearnerTestPush, submitPublicChallengeAttempt, toggleLearnerBookmark, updateLearnerProfile, updateLearnerSystem, updateOwnerQuestionReportStatus, updateReminderPreferences, upsertPushSubscription } from "./db";
import { authorisedImportSchema } from "./questionImport";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const subjectSchema = z.enum(["Use of English", "Biology", "Chemistry", "Physics"]);
const roundSubjectSchema = z.union([subjectSchema, z.literal("Full JAMB Mock")]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  learner: router({
    dashboard: protectedProcedure.query(({ ctx }) => getLearnerDashboard(ctx.user.id, ctx.user.name ?? null)),
    cbtHistory: protectedProcedure.query(({ ctx }) => getLearnerCbtHistory(ctx.user.id, ctx.user.name ?? null)),
    roundReview: protectedProcedure.input(z.object({ roundId: z.number().int().positive() })).mutation(({ ctx, input }) => getLearnerRoundReview(ctx.user.id, ctx.user.name ?? null, input.roundId)),
    updateProfile: protectedProcedure.input(z.object({
      displayName: z.string().trim().max(80).optional(),
      targetScore: z.number().int().min(1).max(400).optional(),
      timeZone: z.string().trim().min(1).max(64).optional(),
    })).mutation(({ ctx, input }) => updateLearnerProfile(ctx.user.id, ctx.user.name ?? null, input)),
    updateSystem: protectedProcedure.input(z.object({
      dailyMinimum: z.number().int().min(5).max(500).optional(),
      dailyGoalCount: z.number().int().min(5).max(500).optional(),
      dailyGoalSubject: subjectSchema.nullable().optional(),
      dailyGoalTopic: z.string().trim().min(1).max(160).nullable().optional(),
    })).mutation(({ ctx, input }) => updateLearnerSystem(ctx.user.id, ctx.user.name ?? null, input)),
    updateReminder: protectedProcedure.input(z.object({
      enabled: z.boolean().optional(),
      reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    })).mutation(({ ctx, input }) => updateReminderPreferences(ctx.user.id, ctx.user.name ?? null, input)),
    confirmProviderEnrollment: protectedProcedure.mutation(({ ctx }) => confirmProviderEnrollment(ctx.user.id, ctx.user.name ?? null)),
    refreshProviderReminderQueue: protectedProcedure.mutation(({ ctx }) => refreshProviderScheduledReminders(ctx.user.id, ctx.user.name ?? null)),
    enablePush: protectedProcedure.input(z.object({
      endpoint: z.string().url(),
      keys: z.object({ p256dh: z.string().min(8), auth: z.string().min(8) }),
    })).mutation(({ ctx, input }) => upsertPushSubscription(ctx.user.id, ctx.user.name ?? null, JSON.stringify(input))),
    disablePush: protectedProcedure.mutation(({ ctx }) => disablePushSubscriptions(ctx.user.id, ctx.user.name ?? null)),
    sendTestPush: protectedProcedure.mutation(({ ctx }) => sendLearnerTestPush(ctx.user.id)),
    toggleBookmark: protectedProcedure.input(z.object({
      questionId: z.string().min(1).max(128),
      subject: subjectSchema,
      topic: z.string().trim().min(1).max(160),
    })).mutation(({ ctx, input }) => toggleLearnerBookmark(ctx.user.id, ctx.user.name ?? null, input)),
    reportQuestion: protectedProcedure.input(z.object({
      questionId: z.string().min(1).max(128),
      subject: subjectSchema,
      topic: z.string().trim().min(1).max(160),
      reason: z.enum(["wrong_answer", "missing_context", "broken_diagram", "confusing_wording", "other"]),
      note: z.string().trim().max(500).optional(),
    })).mutation(({ ctx, input }) => reportLearnerQuestion(ctx.user.id, ctx.user.name ?? null, input)),
    myQuestionReports: protectedProcedure.query(({ ctx }) => getLearnerQuestionReportReceipts(ctx.user.id, ctx.user.name ?? null)),
    recordRound: protectedProcedure.input(z.object({
      subject: roundSubjectSchema,
      mode: z.enum(["sprint", "cbt", "review"]),
      questionCount: z.number().int().min(1).max(100),
      correctCount: z.number().int().min(0).max(100),
      score: z.number().int().min(0).max(100_000),
      wrongIds: z.array(z.string().min(1).max(128)).max(100),
      durationSeconds: z.number().int().min(0).max(21_600).default(0),
      flaggedIds: z.array(z.string().min(1).max(128)).max(100).default([]),
      answerReview: z.array(z.object({
        questionId: z.string().min(1).max(128),
        subject: subjectSchema,
        topic: z.string().min(1).max(160),
        selectedIndex: z.number().int().min(0).max(4).nullable(),
        correct: z.boolean(),
        timedOut: z.boolean(),
        flagged: z.boolean(),
        mistakeReason: z.enum(["concept", "calculation", "reading", "careless"]).optional(),
      })).max(100).default([]),
    })).mutation(({ ctx, input }) => recordLearnerRound(ctx.user.id, ctx.user.name ?? null, {
      ...input,
      durationSeconds: input.durationSeconds ?? 0,
      flaggedIds: input.flaggedIds ?? [],
      answerReview: input.answerReview ?? [],
    })),
  }),
  questionSources: router({
    list: publicProcedure.query(() => getQuestionSourceCatalogue()),
  }),
  questions: router({
    authorisedPlayable: publicProcedure.query(() => getPlayableAuthorisedQuestions()),
  }),
  push: router({
    publicKey: publicProcedure.query(() => getWebPushPublicKey()),
    oneSignalAppId: publicProcedure.query(() => getOneSignalAppId()),
  }),
  challenges: router({
    discover: publicProcedure.input(z.object({ subject: subjectSchema.optional() }).optional()).query(({ input }) => getArenaDiscoverChallenges(input?.subject)),
    create: protectedProcedure.input(z.object({
      challengeName: z.string().trim().min(2).max(80),
      questionIds: z.array(z.string().trim().min(1).max(128)).min(5).max(30),
      visibility: z.enum(["link_only", "public"]).default("link_only"),
      description: z.string().trim().max(240).optional(),
    })).mutation(({ ctx, input }) => createPublicChallenge(ctx.user.id, input.challengeName, input.questionIds, input.visibility, input.description)),
    get: publicProcedure.input(z.object({ challengeCode: z.string().trim().min(6).max(16) })).query(({ input }) => getPublicChallenge(input.challengeCode)),
    leaderboard: publicProcedure.input(z.object({ challengeCode: z.string().trim().min(6).max(16) })).query(({ input }) => getPublicChallengeLeaderboard(input.challengeCode)),
    submit: publicProcedure.input(z.object({
      challengeCode: z.string().trim().min(6).max(16),
      participantName: z.string().trim().min(1).max(48),
      answers: z.array(z.object({ questionId: z.string().min(1).max(128), selectedIndex: z.number().int().min(0).max(4).nullable() })).max(30),
      durationSeconds: z.number().int().min(0).max(21_600),
    })).mutation(({ ctx, input }) => submitPublicChallengeAttempt(ctx.user?.id ?? null, input.challengeCode, input.participantName, input.answers, input.durationSeconds)),
  }),
  qualityReview: router({
    questionReports: adminProcedure.query(() => getOwnerQuestionReports()),
    heldDiagramRecords: adminProcedure.query(() => getOwnerHeldDiagramRecords()),
    diagramAuditPage: adminProcedure.input(z.object({
      subject: z.union([subjectSchema, z.literal("all")]),
      state: z.enum(["all", "missing", "linked"]),
      search: z.string().trim().max(180),
      page: z.number().int().min(0).max(1_000),
      pageSize: z.number().int().min(8).max(30),
    })).query(({ input }) => getOwnerDiagramAuditPage(input)),
    approvedQuestionSummary: adminProcedure.query(() => getOwnerApprovedQuestionReviewSummary()),
    approvedQuestionPage: adminProcedure.input(z.object({
      subject: subjectSchema,
      page: z.number().int().min(0).max(1_000),
      pageSize: z.number().int().min(10).max(30),
    })).query(({ input }) => getOwnerApprovedQuestionReviewPage(input)),
    updateQuestionReportStatus: adminProcedure.input(z.object({
      reportId: z.number().int().positive(),
      status: z.enum(learnerQuestionReportStatuses),
    })).mutation(({ ctx, input }) => updateOwnerQuestionReportStatus(ctx.user.id, input.reportId, input.status)),
    correctApprovedQuestion: adminProcedure.input(z.object({
      questionItemId: z.number().int().positive(),
      questionText: z.string().trim().min(5).max(2_000),
      options: z.array(z.string().trim().min(1).max(500)).min(2).max(5),
      answerIndex: z.number().int().min(0).max(4),
      explanation: z.string().trim().min(5).max(4_000),
      topic: z.string().trim().min(1).max(160),
      diagramUrl: z.string().trim().url().max(500).nullable(),
    })).mutation(({ ctx, input }) => updateOwnerApprovedQuestion(ctx.user.id, input)),
    correctionHistory: adminProcedure.input(z.object({ questionItemId: z.number().int().positive() })).query(({ input }) => getOwnerQuestionCorrectionHistory(input.questionItemId)),
  }),
  questionImports: router({
    validate: adminProcedure.input(authorisedImportSchema).query(({ input }) => ({
      valid: true,
      sourceLabel: input.sourceLabel,
      questionCount: input.questions.length,
      subjects: Array.from(new Set(input.questions.map((question) => question.subject))),
    })),
    import: adminProcedure.input(authorisedImportSchema).mutation(({ ctx, input }) => importAuthorisedQuestionSet(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
