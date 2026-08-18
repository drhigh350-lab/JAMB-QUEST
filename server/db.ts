/* Field Notes Arcade: database helpers keep learner identity, revision ledger, question provenance, and comeback system explicit. */

import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "node:crypto";
import mysql, { type Pool } from "mysql2";
import webpush, { type PushSubscription } from "web-push";
import {
  InsertUser,
  learnerAchievements,
  learnerBookmarks,
  learnerDailyActivities,
  learnerProfiles,
  learnerProviderReminderQueue,
  learnerProgress,
  learnerPushSubscriptions,
  learnerReminderPreferences,
  learnerSystems,
  projectPushConfigs,
  questionImports,
  questionItems,
  questionSources,
  quizRounds,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { AuthorisedQuestionImport } from "./questionImport";
import { inferTopicFromQuestion, inferVerifiedTopic } from "../shared/topicInference";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export type LedgerSnapshot = {
  totalAnswered: number;
  totalCorrect: number;
  bestScore: number;
  lastScore: number;
  roundsPlayed: number;
  wrongIds: string[];
  subjectBest: Record<string, number>;
};

export type LearnerDashboard = {
  profile: { displayName: string | null; targetScore: number; timeZone: string };
  progress: LedgerSnapshot;
  comeback: {
    dailyMinimum: number;
    dailyGoalCount: number;
    dailyGoalSubject: string | null;
    dailyGoalTopic: string | null;
    currentStreak: number;
    longestStreak: number;
    comebackXp: number;
    level: number;
    recoveryPending: boolean;
    consistencyScore: number;
    today: { dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; xpEarned: number };
    activity: Array<{ dateKey: string; questionsAnswered: number; correctCount: number; completedMinimum: boolean; recoveryAction: boolean; xpEarned: number }>;
    badges: string[];
  };
  reminder: { enabled: boolean; reminderTime: string; pushEnabled: boolean; providerQueue: { scheduledCount: number; nextScheduledAt: Date | null; horizonDays: number } };
  achievementStats: { activeDays: number; completedGoalDays: number; cbtRounds: number; fullMocks: number; recordedStudyMinutes: number; subjectsPractised: string[] };
  performance: { weakTopics: Array<{ topic: string; subject: string | null; misses: number; attempts: number; accuracy: number }>; subjectPerformance: Array<{ subject: string; attempts: number; accuracy: number }>; fullMockSubjectPerformance: Array<{ subject: string; attempts: number; accuracy: number }> };
  revision: { bookmarks: Array<{ questionId: string; subject: string; topic: string; createdAt: Date }>; recommendedTopic: { topic: string; subject: string } | null };
  comparison: { latest: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; previous: { id: number; accuracy: number; durationSeconds: number; flaggedCount: number; completedAt: Date } | null; accuracyChange: number | null; recommendation: string };
  recentRounds: Array<{
    id: number;
    subject: string;
    mode: string;
    questionCount: number;
    correctCount: number;
    score: number;
    durationSeconds: number;
    flaggedCount: number;
    missedQuestionIds: string[];
    completedAt: Date;
  }>;
};

export type RoundRecordInput = {
  subject: string;
  mode: string;
  questionCount: number;
  correctCount: number;
  score: number;
  wrongIds: string[];
  durationSeconds: number;
  flaggedIds: string[];
  answerReview: Array<{ questionId: string; subject: string; topic: string; selectedIndex: number | null; correct: boolean; timedOut: boolean; flagged: boolean }>;
};

const EMPTY_LEDGER: LedgerSnapshot = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestScore: 0,
  lastScore: 0,
  roundsPlayed: 0,
  wrongIds: [],
  subjectBest: {},
};

const BADGE_KEYS = ["first-step", "returner", "three-day-builder", "seven-day-builder", "hundred-mark-club"] as const;

// Lazily create one managed mysql2 pool so app traffic and bulk imports share a bounded connection lifecycle.
export async function getDb() {
  if (_db) return _db;
  if (ENV.databaseUrl) {
    try {
      _pool = mysql.createPool({ uri: ENV.databaseUrl, connectionLimit: 4, connectTimeout: 10_000, enableKeepAlive: true });
      await _pool.promise().query("SELECT 1");
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect; database-backed actions are unavailable.");
      _pool?.end();
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function parseStringList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(-80) : [];
  } catch {
    return [];
  }
}

function parseScoreMap(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const scoreMap: Record<string, number> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([subject, value]) => {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) scoreMap[subject] = value;
    });
    return scoreMap;
  } catch {
    return {};
  }
}

export type PersistedExamAnswer = { questionId: string | null; topic: string; subject: string | null; selectedIndex: number | null; correct: boolean; timedOut: boolean; flagged: boolean };

export function parseAnswerReview(raw: string | null): PersistedExamAnswer[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as { questionId?: unknown; topic?: unknown; subject?: unknown; selectedIndex?: unknown; correct?: unknown; timedOut?: unknown; flagged?: unknown };
      const selectedIndex = typeof value.selectedIndex === "number" && Number.isInteger(value.selectedIndex) && value.selectedIndex >= 0 && value.selectedIndex <= 4 ? value.selectedIndex : null;
      return typeof value.topic === "string" && typeof value.correct === "boolean" ? [{ questionId: typeof value.questionId === "string" ? value.questionId : null, topic: value.topic, subject: typeof value.subject === "string" ? value.subject : null, selectedIndex, correct: value.correct, timedOut: Boolean(value.timedOut), flagged: Boolean(value.flagged) }] : [];
    });
  } catch {
    return [];
  }
}

function normalisePersistedTopic(subject: string | null, topic: string, inferredTopic?: string): string | null {
  const cleaned = topic.trim();
  if ((!cleaned || cleaned.toLowerCase() === "to be tagged during syllabus mapping") && inferredTopic) return inferredTopic;
  if (!cleaned || cleaned.toLowerCase() === "to be tagged during syllabus mapping" || cleaned.toLowerCase() === "unclassified") return null;
  return cleaned;
}

export function summariseWeakTopicsFromRounds(rounds: Array<{ answerReviewJson: string | null }>, inferredTopicsByQuestionId = new Map<string, string>()) {
  const weakTopicMap = new Map<string, { misses: number; attempts: number; subject: string | null }>();
  rounds.flatMap((round) => parseAnswerReview(round.answerReviewJson)).forEach((answer) => {
    const topic = normalisePersistedTopic(answer.subject, answer.topic, answer.questionId ? inferredTopicsByQuestionId.get(answer.questionId) : undefined);
    if (!topic) return;
    const key = `${answer.subject ?? ""}\u0000${topic}`;
    const current = weakTopicMap.get(key) ?? { misses: 0, attempts: 0, subject: answer.subject };
    current.attempts += 1;
    if (!answer.correct) current.misses += 1;
    weakTopicMap.set(key, current);
  });
  return Array.from(weakTopicMap.entries()).map(([key, value]) => ({ topic: key.split("\u0000")[1] ?? key, ...value, accuracy: Math.round(((value.attempts - value.misses) / value.attempts) * 100) })).filter((topic) => topic.misses > 0).sort((left, right) => right.misses - left.misses || left.accuracy - right.accuracy).slice(0, 5);
}

export function buildExamComparison(
  rounds: Array<{ id: number; mode: string; questionCount: number; correctCount: number; durationSeconds: number; flaggedCount: number; completedAt: Date }>,
  weakTopics: Array<{ topic: string; subject: string | null; misses: number; attempts: number; accuracy: number }>,
) {
  const exams = rounds.filter((round) => round.mode === "cbt").slice(0, 2);
  const latestRound = exams[0];
  const previousRound = exams[1];
  const toSummary = (round: typeof latestRound) => round ? {
    id: round.id,
    accuracy: round.questionCount ? Math.round((round.correctCount / round.questionCount) * 100) : 0,
    durationSeconds: round.durationSeconds,
    flaggedCount: round.flaggedCount,
    completedAt: round.completedAt,
  } : null;
  const latest = toSummary(latestRound);
  const previous = toSummary(previousRound);
  const accuracyChange = latest && previous ? latest.accuracy - previous.accuracy : null;
  const priorityTopic = weakTopics[0];
  const recommendation = !latest
    ? "Take a timed CBT mock to create your first performance baseline."
    : priorityTopic
      ? `Run a focused ${Math.min(20, Math.max(10, priorityTopic.misses * 5))}-question drill on ${priorityTopic.topic}; it is your clearest recovery opportunity.`
      : latest.flaggedCount
        ? "Revisit the questions you flagged, then take another short CBT to confirm the improvement."
        : "Keep your system steady with a short mixed practice round before your next timed CBT.";
  return { latest, previous, accuracyChange, recommendation };
}

export function summariseSubjectPerformance(answers: Array<{ subject?: string | null; correct: boolean }>) {
  const bySubject = new Map<string, { attempts: number; correct: number }>();
  answers.forEach((answer) => {
    if (!answer.subject) return;
    const current = bySubject.get(answer.subject) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    if (answer.correct) current.correct += 1;
    bySubject.set(answer.subject, current);
  });
  return Array.from(bySubject.entries()).map(([subject, value]) => ({ subject, attempts: value.attempts, accuracy: Math.round((value.correct / value.attempts) * 100) })).sort((left, right) => left.subject.localeCompare(right.subject));
}

export function selectFullMockSubjectPerformance(rounds: Array<{ subject: string; questionCount: number; answerReviewJson: string | null }>) {
  // Dashboard rounds are newest-first, so the first matching full mock is the latest one.
  const latestFullMock = rounds.find((round) => round.subject === "Full JAMB Mock" && round.questionCount === 180);
  return latestFullMock ? summariseSubjectPerformance(parseAnswerReview(latestFullMock.answerReviewJson)) : [];
}

export function buildLedgerSnapshot(input: {
  totalAnswered?: number;
  totalCorrect?: number;
  bestScore?: number;
  lastScore?: number;
  roundsPlayed?: number;
  wrongQuestionIds?: string | null;
  subjectBestScores?: string | null;
} | undefined): LedgerSnapshot {
  if (!input) return EMPTY_LEDGER;
  return {
    totalAnswered: Math.max(0, input.totalAnswered ?? 0),
    totalCorrect: Math.max(0, input.totalCorrect ?? 0),
    bestScore: Math.max(0, input.bestScore ?? 0),
    lastScore: Math.max(0, input.lastScore ?? 0),
    roundsPlayed: Math.max(0, input.roundsPlayed ?? 0),
    wrongIds: parseStringList(input.wrongQuestionIds ?? null),
    subjectBest: parseScoreMap(input.subjectBestScores ?? null),
  };
}

async function ensureLearnerRows(userId: number, fallbackName: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  await db.insert(learnerProfiles).values({ userId, displayName: fallbackName }).onDuplicateKeyUpdate({ set: { userId } });
  await db.insert(learnerProgress).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  await db.insert(learnerSystems).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  await db.insert(learnerReminderPreferences).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  return db;
}

function localDateKey(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function daysBetween(firstDate: string, secondDate: string) {
  return Math.round((Date.parse(`${secondDate}T00:00:00Z`) - Date.parse(`${firstDate}T00:00:00Z`)) / 86_400_000);
}

export function levelForXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export function summariseAchievementStats(input: {
  activities: Array<{ completedMinimum: number | boolean }>;
  rounds: Array<{ mode: string; subject: string; questionCount: number; durationSeconds: number }>;
}) {
  const cbtRounds = input.rounds.filter((round) => round.mode === "cbt").length;
  const fullMocks = input.rounds.filter((round) => round.subject === "Full JAMB Mock" && round.questionCount === 180).length;
  const subjectsPractised = Array.from(new Set(input.rounds.flatMap((round) => round.subject === "Full JAMB Mock" ? [] : [round.subject]))).sort();
  return {
    activeDays: input.activities.length,
    completedGoalDays: input.activities.filter((activity) => Boolean(activity.completedMinimum)).length,
    cbtRounds,
    fullMocks,
    recordedStudyMinutes: Math.round(input.rounds.reduce((total, round) => total + Math.max(0, round.durationSeconds), 0) / 60),
    subjectsPractised,
  };
}

async function claimBadge(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, badgeKey: typeof BADGE_KEYS[number]) {
  await db.insert(learnerAchievements).values({ claimKey: `${userId}:${badgeKey}`, userId, badgeKey }).onDuplicateKeyUpdate({ set: { claimKey: `${userId}:${badgeKey}` } });
}

export async function getLearnerDashboard(userId: number, fallbackName: string | null): Promise<LearnerDashboard> {
  const db = await ensureLearnerRows(userId, fallbackName);
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  const [progress] = await db.select().from(learnerProgress).where(eq(learnerProgress.userId, userId)).limit(1);
  const [system] = await db.select().from(learnerSystems).where(eq(learnerSystems.userId, userId)).limit(1);
  const [reminder] = await db.select().from(learnerReminderPreferences).where(eq(learnerReminderPreferences.userId, userId)).limit(1);
  const [pushSubscription] = await db.select().from(learnerPushSubscriptions).where(eq(learnerPushSubscriptions.userId, userId)).limit(1);
  const activities = await db.select().from(learnerDailyActivities).where(eq(learnerDailyActivities.userId, userId));
  const achievements = await db.select().from(learnerAchievements).where(eq(learnerAchievements.userId, userId));
  const allRoundSummary = await db.select({ mode: quizRounds.mode, subject: quizRounds.subject, questionCount: quizRounds.questionCount, durationSeconds: quizRounds.durationSeconds }).from(quizRounds).where(eq(quizRounds.userId, userId));
  // Anchor analytics to the newest rounds; limiting an ascending query froze weakness analysis on the oldest history after 12 rounds.
  const rounds = await db.select().from(quizRounds).where(eq(quizRounds.userId, userId)).orderBy(desc(quizRounds.completedAt)).limit(12);
  const bookmarks = await db.select().from(learnerBookmarks).where(eq(learnerBookmarks.userId, userId));
  const queuedProviderReminders = await db.select().from(learnerProviderReminderQueue).where(and(eq(learnerProviderReminderQueue.userId, userId), eq(learnerProviderReminderQueue.status, "scheduled"), gt(learnerProviderReminderQueue.scheduledFor, new Date())));
  const timeZone = profile?.timeZone ?? "Africa/Lagos";
  const dateKey = localDateKey(timeZone);
  const recentActivity = activities.sort((left, right) => left.dateKey.localeCompare(right.dateKey)).slice(-14);
  const answerReviews = rounds.flatMap((round) => parseAnswerReview(round.answerReviewJson));
  const placeholderIds = Array.from(new Set(answerReviews.flatMap((answer) => {
    const match = answer.questionId?.match(/^authorised-(\d+)$/);
    return match && answer.topic.trim().toLowerCase() === "to be tagged during syllabus mapping" ? [Number(match[1])] : [];
  })));
  const placeholderQuestions = placeholderIds.length ? await db.select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic, questionText: questionItems.questionText }).from(questionItems).where(inArray(questionItems.id, placeholderIds)) : [];
  const inferredTopicsByQuestionId = new Map(placeholderQuestions.flatMap((question) => {
    const inferredTopic = question.topic.trim().toLowerCase() === "to be tagged during syllabus mapping"
      ? inferVerifiedTopic(question.subject as "Use of English" | "Biology" | "Chemistry" | "Physics", question.questionText)
      : question.topic;
    return inferredTopic ? [[`authorised-${question.id}`, inferredTopic] as const] : [];
  }));
  const weakTopics = summariseWeakTopicsFromRounds(rounds, inferredTopicsByQuestionId);
  const subjectPerformance = summariseSubjectPerformance(answerReviews);
  const fullMockSubjectPerformance = selectFullMockSubjectPerformance(rounds);
  const recentRounds = rounds.map((round) => {
    const review = parseAnswerReview(round.answerReviewJson);
    return {
      id: round.id,
      subject: round.subject,
      mode: round.mode,
      questionCount: round.questionCount,
      correctCount: round.correctCount,
      score: round.score,
      durationSeconds: round.durationSeconds,
      flaggedCount: parseStringList(round.flaggedQuestionIds).length,
      missedQuestionIds: review.flatMap((answer) => !answer.correct && answer.questionId ? [answer.questionId] : []),
      completedAt: round.completedAt,
    };
  });
  const comparison = buildExamComparison(recentRounds, weakTopics);
  const today = activities.find((activity) => activity.dateKey === dateKey);
  const completedDays = recentActivity.filter((activity) => activity.completedMinimum).length;

  return {
    profile: { displayName: profile?.displayName ?? fallbackName, targetScore: profile?.targetScore ?? 380, timeZone },
    progress: buildLedgerSnapshot(progress),
    comeback: {
      dailyMinimum: system?.dailyMinimum ?? 10,
      dailyGoalCount: system?.dailyGoalCount ?? system?.dailyMinimum ?? 10,
      dailyGoalSubject: system?.dailyGoalSubject ?? null,
      dailyGoalTopic: system?.dailyGoalTopic ?? null,
      currentStreak: system?.currentStreak ?? 0,
      longestStreak: system?.longestStreak ?? 0,
      comebackXp: system?.comebackXp ?? 0,
      level: system?.level ?? 1,
      recoveryPending: Boolean(system?.recoveryPending),
      consistencyScore: Math.round((completedDays / 14) * 100),
      today: {
        dateKey,
        questionsAnswered: today?.questionsAnswered ?? 0,
        correctCount: today?.correctCount ?? 0,
        completedMinimum: Boolean(today?.completedMinimum),
        xpEarned: today?.xpEarned ?? 0,
      },
      activity: recentActivity.map((activity) => ({
        dateKey: activity.dateKey,
        questionsAnswered: activity.questionsAnswered,
        correctCount: activity.correctCount,
        completedMinimum: Boolean(activity.completedMinimum),
        recoveryAction: Boolean(activity.recoveryAction),
        xpEarned: activity.xpEarned,
      })),
      badges: achievements.map((achievement) => achievement.badgeKey),
    },
    reminder: {
      enabled: Boolean(reminder?.enabled),
      reminderTime: reminder?.reminderTime ?? "19:00",
      pushEnabled: Boolean(pushSubscription?.enabled),
      providerQueue: {
        scheduledCount: queuedProviderReminders.length,
        nextScheduledAt: queuedProviderReminders.sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime())[0]?.scheduledFor ?? null,
        horizonDays: PROVIDER_QUEUE_HORIZON_DAYS,
      },
    },
    achievementStats: summariseAchievementStats({ activities, rounds: allRoundSummary }),
    performance: { weakTopics, subjectPerformance, fullMockSubjectPerformance },
    revision: { bookmarks: bookmarks.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 24).map((bookmark) => ({ questionId: bookmark.questionId, subject: bookmark.subject, topic: bookmark.topic, createdAt: bookmark.createdAt })), recommendedTopic: weakTopics[0]?.subject ? { topic: weakTopics[0].topic, subject: weakTopics[0].subject } : null },
    comparison,
    recentRounds,
  };
}

export async function getLearnerRoundReview(userId: number, fallbackName: string | null, roundId: number) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const [round] = await db.select().from(quizRounds).where(and(eq(quizRounds.id, roundId), eq(quizRounds.userId, userId))).limit(1);
  if (!round || round.mode !== "cbt") return null;
  return {
    id: round.id,
    subject: round.subject,
    mode: round.mode,
    questionCount: round.questionCount,
    correctCount: round.correctCount,
    score: round.score,
    durationSeconds: round.durationSeconds,
    completedAt: round.completedAt,
    answerReview: parseAnswerReview(round.answerReviewJson),
  };
}

export async function getLearnerCbtHistory(userId: number, fallbackName: string | null) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const rounds = await db.select().from(quizRounds).where(and(eq(quizRounds.userId, userId), eq(quizRounds.mode, "cbt"))).orderBy(desc(quizRounds.completedAt)).limit(100);
  return rounds.map((round) => {
    const review = parseAnswerReview(round.answerReviewJson);
    return {
      id: round.id,
      subject: round.subject,
      mode: round.mode,
      questionCount: round.questionCount,
      correctCount: round.correctCount,
      score: round.score,
      durationSeconds: round.durationSeconds,
      flaggedCount: parseStringList(round.flaggedQuestionIds).length,
      missedQuestionIds: review.flatMap((answer) => !answer.correct && answer.questionId ? [answer.questionId] : []),
      completedAt: round.completedAt,
    };
  });
}

export async function toggleLearnerBookmark(userId: number, fallbackName: string | null, input: { questionId: string; subject: string; topic: string }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const bookmarkKey = `${userId}:${input.questionId}`;
  const [existing] = await db.select().from(learnerBookmarks).where(eq(learnerBookmarks.bookmarkKey, bookmarkKey)).limit(1);
  if (existing) await db.delete(learnerBookmarks).where(eq(learnerBookmarks.id, existing.id));
  else await db.insert(learnerBookmarks).values({ bookmarkKey, userId, questionId: input.questionId, subject: input.subject, topic: input.topic });
  return getLearnerDashboard(userId, fallbackName);
}

export async function updateLearnerProfile(userId: number, fallbackName: string | null, update: { displayName?: string; targetScore?: number; timeZone?: string }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const set: { displayName?: string | null; targetScore?: number; timeZone?: string } = {};
  if (update.displayName !== undefined) set.displayName = update.displayName.trim() || null;
  if (update.targetScore !== undefined) set.targetScore = update.targetScore;
  if (update.timeZone !== undefined) set.timeZone = update.timeZone;
  if (Object.keys(set).length) await db.update(learnerProfiles).set(set).where(eq(learnerProfiles.userId, userId));
  return getLearnerDashboard(userId, fallbackName);
}

export function countGoalQuestions(answerReview: Array<{ subject: string; topic: string }>, questionCount: number, goalSubject: string | null, goalTopic: string | null) {
  if (!goalSubject || !goalTopic) return questionCount;
  return answerReview.filter((answer) => answer.subject === goalSubject && answer.topic === goalTopic).length;
}

export async function recordLearnerRound(userId: number, fallbackName: string | null, input: RoundRecordInput) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const [stored] = await db.select().from(learnerProgress).where(eq(learnerProgress.userId, userId)).limit(1);
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  const [system] = await db.select().from(learnerSystems).where(eq(learnerSystems.userId, userId)).limit(1);
  const current = buildLedgerSnapshot(stored);
  const newWrongIds = Array.from(new Set([...current.wrongIds, ...input.wrongIds.filter((id) => typeof id === "string")])).slice(-80);
  const subjectBest = input.subject === "Full JAMB Mock" ? current.subjectBest : { ...current.subjectBest, [input.subject]: Math.max(current.subjectBest[input.subject] ?? 0, input.score) };

  await db.update(learnerProgress).set({
    totalAnswered: current.totalAnswered + input.questionCount,
    totalCorrect: current.totalCorrect + input.correctCount,
    bestScore: Math.max(current.bestScore, input.score),
    lastScore: input.score,
    roundsPlayed: current.roundsPlayed + 1,
    wrongQuestionIds: JSON.stringify(newWrongIds),
    subjectBestScores: JSON.stringify(subjectBest),
  }).where(eq(learnerProgress.userId, userId));

  await db.insert(quizRounds).values({
    userId,
    subject: input.subject,
    mode: input.mode,
    questionCount: input.questionCount,
    correctCount: input.correctCount,
    score: input.score,
    durationSeconds: input.durationSeconds,
    flaggedQuestionIds: JSON.stringify(input.flaggedIds),
    answerReviewJson: JSON.stringify(input.answerReview),
  });

  const timeZone = profile?.timeZone ?? "Africa/Lagos";
  const dateKey = localDateKey(timeZone);
  const activityKey = `${userId}:${dateKey}`;
  const [today] = await db.select().from(learnerDailyActivities).where(eq(learnerDailyActivities.activityKey, activityKey)).limit(1);
  const dailyMinimum = system?.dailyGoalCount ?? system?.dailyMinimum ?? 10;
  const goalSubject = system?.dailyGoalSubject ?? null;
  const goalTopic = system?.dailyGoalTopic ?? null;
  const goalMatches = countGoalQuestions(input.answerReview, input.questionCount, goalSubject, goalTopic);
  const questionsAnswered = (today?.questionsAnswered ?? 0) + goalMatches;
  const correctCount = (today?.correctCount ?? 0) + input.correctCount;
  const completedMinimum = questionsAnswered >= dailyMinimum;
  const firstCompletionToday = completedMinimum && !today?.completedMinimum;
  const baseXp = input.questionCount * 10 + input.correctCount * 5;
  const lastCompletedDate = system?.lastCompletedDate ?? null;
  const gaps = lastCompletedDate ? daysBetween(lastCompletedDate, dateKey) : 0;
  const recoveryAction = Boolean(firstCompletionToday && lastCompletedDate && gaps > 1);
  const completionBonus = firstCompletionToday ? 35 + (recoveryAction ? 40 : 0) : 0;
  const xpEarned = baseXp + completionBonus;

  if (today) {
    await db.update(learnerDailyActivities).set({
      questionsAnswered,
      correctCount,
      roundsCompleted: today.roundsCompleted + 1,
      xpEarned: today.xpEarned + xpEarned,
      completedMinimum: completedMinimum ? 1 : 0,
      recoveryAction: recoveryAction ? 1 : today.recoveryAction,
    }).where(eq(learnerDailyActivities.id, today.id));
  } else {
    await db.insert(learnerDailyActivities).values({
      activityKey,
      userId,
      dateKey,
      questionsAnswered,
      correctCount,
      roundsCompleted: 1,
      xpEarned,
      completedMinimum: completedMinimum ? 1 : 0,
      recoveryAction: recoveryAction ? 1 : 0,
    });
  }

  let currentStreak = system?.currentStreak ?? 0;
  let longestStreak = system?.longestStreak ?? 0;
  let recoveryPending = system?.recoveryPending ?? 0;
  let nextCompletedDate = lastCompletedDate;
  if (firstCompletionToday) {
    currentStreak = lastCompletedDate && gaps === 1 ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    recoveryPending = 0;
    nextCompletedDate = dateKey;
  } else if (lastCompletedDate && gaps > 1) {
    recoveryPending = 1;
  }
  const comebackXp = (system?.comebackXp ?? 0) + xpEarned;
  const level = levelForXp(comebackXp);
  await db.update(learnerSystems).set({ currentStreak, longestStreak, comebackXp, level, lastCompletedDate: nextCompletedDate, recoveryPending }).where(eq(learnerSystems.userId, userId));

  if ((system?.comebackXp ?? 0) === 0 && xpEarned > 0) await claimBadge(db, userId, "first-step");
  if (recoveryAction) await claimBadge(db, userId, "returner");
  if (currentStreak >= 3) await claimBadge(db, userId, "three-day-builder");
  if (currentStreak >= 7) await claimBadge(db, userId, "seven-day-builder");
  if (comebackXp >= 1_000) await claimBadge(db, userId, "hundred-mark-club");

  return getLearnerDashboard(userId, fallbackName);
}

export async function updateLearnerSystem(userId: number, fallbackName: string | null, update: { dailyMinimum?: number; dailyGoalCount?: number; dailyGoalSubject?: string | null; dailyGoalTopic?: string | null }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const set: { dailyMinimum?: number; dailyGoalCount?: number; dailyGoalSubject?: string | null; dailyGoalTopic?: string | null } = {};
  if (update.dailyMinimum !== undefined) set.dailyMinimum = update.dailyMinimum;
  if (update.dailyGoalCount !== undefined) { set.dailyGoalCount = update.dailyGoalCount; set.dailyMinimum = update.dailyGoalCount; }
  if (update.dailyGoalSubject !== undefined) set.dailyGoalSubject = update.dailyGoalSubject;
  if (update.dailyGoalTopic !== undefined) set.dailyGoalTopic = update.dailyGoalTopic;
  if (Object.keys(set).length) await db.update(learnerSystems).set(set).where(eq(learnerSystems.userId, userId));
  return getLearnerDashboard(userId, fallbackName);
}

export async function updateReminderPreferences(userId: number, fallbackName: string | null, update: { enabled?: boolean; reminderTime?: string }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const set: { enabled?: number; reminderTime?: string } = {};
  if (update.enabled !== undefined) set.enabled = update.enabled ? 1 : 0;
  if (update.reminderTime !== undefined) set.reminderTime = update.reminderTime;
  if (Object.keys(set).length) await db.update(learnerReminderPreferences).set(set).where(eq(learnerReminderPreferences.userId, userId));
  if (update.enabled === false) await cancelProviderScheduledReminders(userId);
  if (update.enabled === true) await refreshProviderScheduledReminders(userId, fallbackName);
  return getLearnerDashboard(userId, fallbackName);
}

export async function upsertPushSubscription(userId: number, fallbackName: string | null, subscriptionJson: string) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const endpointHash = createHash("sha256").update(subscriptionJson).digest("hex");
  await db.insert(learnerPushSubscriptions).values({ endpointHash, userId, subscriptionJson, enabled: 1 }).onDuplicateKeyUpdate({ set: { userId, subscriptionJson, enabled: 1 } });
  return getLearnerDashboard(userId, fallbackName);
}

export async function disablePushSubscriptions(userId: number, fallbackName: string | null) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const subscriptions = await db.select().from(learnerPushSubscriptions).where(eq(learnerPushSubscriptions.userId, userId));
  await Promise.all(subscriptions.map((subscription) => db.update(learnerPushSubscriptions).set({ enabled: 0 }).where(eq(learnerPushSubscriptions.id, subscription.id))));
  return getLearnerDashboard(userId, fallbackName);
}

async function getOrCreatePushConfig() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [stored] = await db.select().from(projectPushConfigs).where(eq(projectPushConfigs.configKey, "web-push-vapid")).limit(1);
  if (stored) return stored;
  const generated = webpush.generateVAPIDKeys();
  await db.insert(projectPushConfigs).values({
    configKey: "web-push-vapid",
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: "mailto:notifications@jambquest.app",
  });
  const [created] = await db.select().from(projectPushConfigs).where(eq(projectPushConfigs.configKey, "web-push-vapid")).limit(1);
  if (!created) throw new Error("Could not initialize browser-push configuration");
  return created;
}

export async function getWebPushPublicKey() {
  const config = await getOrCreatePushConfig();
  return config.publicKey;
}

export function getOneSignalAppId() {
  return process.env.ONESIGNAL_APP_ID ?? null;
}

const PROVIDER_QUEUE_HORIZON_DAYS = 28;
const PROVIDER_QUEUE_URL = "/?tab=profile";
const LAGOS_WINDOWS: Array<{ window: ReminderWindow; hour: number; title: string; body: string }> = [
  { window: "morning", hour: 7, title: "JAMB Quest: start with your system", body: "Your morning JAMB Quest study system is ready. Start with one focused set." },
  { window: "afternoon", hour: 13, title: "JAMB Quest: one deliberate round", body: "Your JAMB Quest study system is still open. One deliberate round changes the evidence." },
  { window: "evening", hour: 19, title: "JAMB Quest: close the day with evidence", body: "Close the day with one focused JAMB Quest round and read the corrections." },
];

type ProviderReminderSlot = { queueKey: string; window: ReminderWindow; scheduledFor: Date };

function lagosDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])) as { year: string; month: string; day: string };
}

/** Nigeria uses Africa/Lagos (UTC+01:00 without daylight-saving shifts). */
export function buildProviderReminderSlots(now = new Date(), horizonDays = PROVIDER_QUEUE_HORIZON_DAYS): ProviderReminderSlot[] {
  const first = lagosDateParts(now);
  const firstLagosMidnightUtc = Date.UTC(Number(first.year), Number(first.month) - 1, Number(first.day), -1, 0, 0);
  return Array.from({ length: horizonDays + 1 }, (_, offset) => new Date(firstLagosMidnightUtc + offset * 86_400_000))
    .flatMap((lagosMidnightUtc) => LAGOS_WINDOWS.map(({ window, hour }) => {
      const scheduledFor = new Date(lagosMidnightUtc.getTime() + hour * 3_600_000);
      const date = lagosDateParts(scheduledFor);
      return { queueKey: `provider:${date.year}-${date.month}-${date.day}:${window}`, window, scheduledFor };
    }))
    .filter((slot) => slot.scheduledFor.getTime() > now.getTime() + 60_000);
}

async function createOneSignalFuturePush(userId: number, title: string, body: string, scheduledFor: Date) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_APP_API_KEY;
  if (!appId || !apiKey) return null;
  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [String(userId)] },
        target_channel: "push",
        headings: { en: title },
        contents: { en: body },
        url: PROVIDER_QUEUE_URL,
        send_after: scheduledFor.toISOString(),
      }),
    });
    if (!response.ok) return null;
    const result = await response.json() as { id?: string; recipients?: number };
    return result.id && Number(result.recipients ?? 0) > 0 ? result.id : null;
  } catch {
    return null;
  }
}

async function cancelOneSignalFuturePush(messageId: string) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_APP_API_KEY;
  if (!appId || !apiKey) return false;
  try {
    const response = await fetch(`https://api.onesignal.com/notifications/${encodeURIComponent(messageId)}?app_id=${encodeURIComponent(appId)}`, {
      method: "DELETE",
      headers: { Authorization: `Key ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function refreshProviderScheduledReminders(userId: number, fallbackName: string | null) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const [preference] = await db.select().from(learnerReminderPreferences).where(eq(learnerReminderPreferences.userId, userId)).limit(1);
  if (!preference?.enabled) return getLearnerDashboard(userId, fallbackName);
  const existing = await db.select().from(learnerProviderReminderQueue).where(eq(learnerProviderReminderQueue.userId, userId));
  const byQueueKey = new Map(existing.map((record) => [record.queueKey, record]));
  for (const slot of buildProviderReminderSlots()) {
    const existingRecord = byQueueKey.get(slot.queueKey);
    if (existingRecord?.status === "scheduled") continue;
    const copy = LAGOS_WINDOWS.find((candidate) => candidate.window === slot.window);
    if (!copy) continue;
    const messageId = await createOneSignalFuturePush(userId, copy.title, copy.body, slot.scheduledFor);
    if (!messageId) continue;
    if (existingRecord) {
      await db.update(learnerProviderReminderQueue).set({ window: slot.window, scheduledFor: slot.scheduledFor, oneSignalMessageId: messageId, status: "scheduled" }).where(eq(learnerProviderReminderQueue.id, existingRecord.id));
    } else {
      await db.insert(learnerProviderReminderQueue).values({ queueKey: slot.queueKey, userId, window: slot.window, scheduledFor: slot.scheduledFor, oneSignalMessageId: messageId, status: "scheduled" });
    }
  }
  return getLearnerDashboard(userId, fallbackName);
}

async function cancelProviderScheduledReminders(userId: number) {
  const db = await getDb();
  if (!db) return;
  const queued = await db.select().from(learnerProviderReminderQueue).where(and(eq(learnerProviderReminderQueue.userId, userId), eq(learnerProviderReminderQueue.status, "scheduled"), gt(learnerProviderReminderQueue.scheduledFor, new Date())));
  await Promise.allSettled(queued.map(async (record) => {
    await cancelOneSignalFuturePush(record.oneSignalMessageId);
    await db.update(learnerProviderReminderQueue).set({ status: "cancelled" }).where(eq(learnerProviderReminderQueue.id, record.id));
  }));
}

async function sendOneSignalPush(userId: number, title: string, body: string, url: string) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_APP_API_KEY;
  if (!appId || !apiKey) return false;
  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [String(userId)] },
        target_channel: "push",
        headings: { en: title },
        contents: { en: body },
        url,
      }),
    });
    if (!response.ok) return false;
    const result = await response.json() as { recipients?: number };
    return Number(result.recipients ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function sendLearnerPush(userId: number, title: string, body: string, url = "/") {
  if (await sendOneSignalPush(userId, title, body, url)) return [{ id: -1, delivered: true }];
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const config = await getOrCreatePushConfig();
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const subscriptions = await db.select().from(learnerPushSubscriptions).where(eq(learnerPushSubscriptions.userId, userId));
  const results = await Promise.allSettled(subscriptions.filter((subscription) => subscription.enabled).map(async (subscription) => {
    try {
      await webpush.sendNotification(JSON.parse(subscription.subscriptionJson) as PushSubscription, JSON.stringify({ title, body, url }));
      return { id: subscription.id, delivered: true };
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode: unknown }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await db.update(learnerPushSubscriptions).set({ enabled: 0 }).where(eq(learnerPushSubscriptions.id, subscription.id));
      return { id: subscription.id, delivered: false };
    }
  }));
  return results.filter((result): result is PromiseFulfilledResult<{ id: number; delivered: boolean }> => result.status === "fulfilled").map((result) => result.value);
}

export function didDeliverPush(results: Array<{ delivered: boolean }>) {
  return results.some((result) => result.delivered);
}

export async function sendLearnerTestPush(userId: number) {
  const results = await sendLearnerPush(
    userId,
    "JAMB Quest: reminder test",
    "Your daily comeback reminder is connected on this device. Keep building your score, one focused set at a time.",
    "/?tab=profile",
  );
  return { delivered: didDeliverPush(results), activeSubscriptions: results.length };
}

export const CONTROLLED_SCHEDULE_TEST_COPY = {
  title: "JAMB Quest: scheduled reminder test",
  body: "This is the 8:30 a.m. scheduled delivery test. Your JAMB Quest reminder route is checking this device now.",
  url: "/?tab=profile",
} as const;

/**
 * Sends a controlled cron-only test through the same transport selection as permanent reminders.
 * It deliberately does not modify morning/afternoon/evening sent-date columns, so it cannot consume
 * a learner's normal daily notification window.
 */
export async function sendControlledScheduleTest() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const preferences = await db.select().from(learnerReminderPreferences).where(eq(learnerReminderPreferences.enabled, 1));
  let sent = 0;
  let skipped = 0;
  for (const preference of preferences) {
    const results = await sendLearnerPush(
      preference.userId,
      CONTROLLED_SCHEDULE_TEST_COPY.title,
      CONTROLLED_SCHEDULE_TEST_COPY.body,
      CONTROLLED_SCHEDULE_TEST_COPY.url,
    );
    if (results.some((result) => result.delivered)) sent += 1;
    else skipped += 1;
  }
  return { window: "controlled-test", sent, skipped, totalEnabled: preferences.length };
}

export type DailyReminderDecision = "send" | "already_sent" | "minimum_completed";
export type ReminderWindow = "morning" | "afternoon" | "evening";

const REMINDER_WINDOW_COPY: Record<ReminderWindow, { title: string; body: (dailyMinimum: number, recovery: boolean) => string }> = {
  morning: {
    title: "JAMB Quest: start with your system",
    body: (dailyMinimum, recovery) => recovery ? "A short recovery review can reset your rhythm before the day gets noisy." : `Your ${dailyMinimum}-question system is ready. Start small before the day decides for you.`,
  },
  afternoon: {
    title: "JAMB Quest: one deliberate round",
    body: (dailyMinimum, recovery) => recovery ? "Your recovery is still waiting. One focused review is enough to restart." : `Your ${dailyMinimum}-question system still has room today. One deliberate round changes the evidence.`,
  },
  evening: {
    title: "JAMB Quest: close the day with evidence",
    body: (dailyMinimum, recovery) => recovery ? "End today by returning to one recovery review. The system is still yours." : `Your ${dailyMinimum}-question system is still open. Finish with a calm round and read the corrections.`,
  },
};

export function getDailyReminderDecision(input: { lastSentDate: string | null; dateKey: string; completedMinimum: boolean }): DailyReminderDecision {
  if (input.lastSentDate === input.dateKey) return "already_sent";
  if (input.completedMinimum) return "minimum_completed";
  return "send";
}

export function getWindowReminderDecision(input: { lastSentDate: string | null; dateKey: string; completedMinimum: boolean }): DailyReminderDecision {
  return getDailyReminderDecision(input);
}

function lastSentDateForWindow(preference: { lastMorningSentDate: string | null; lastAfternoonSentDate: string | null; lastEveningSentDate: string | null }, window: ReminderWindow) {
  if (window === "morning") return preference.lastMorningSentDate;
  if (window === "afternoon") return preference.lastAfternoonSentDate;
  return preference.lastEveningSentDate;
}

function sentDatePatch(window: ReminderWindow, dateKey: string) {
  if (window === "morning") return { lastMorningSentDate: dateKey };
  if (window === "afternoon") return { lastAfternoonSentDate: dateKey };
  return { lastEveningSentDate: dateKey, lastSentDate: dateKey };
}

export async function sendDailyComebackReminders(window: ReminderWindow = "evening") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const preferences = await db.select().from(learnerReminderPreferences).where(eq(learnerReminderPreferences.enabled, 1));
  let sent = 0;
  let skipped = 0;

  for (const preference of preferences) {
    const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, preference.userId)).limit(1);
    const [system] = await db.select().from(learnerSystems).where(eq(learnerSystems.userId, preference.userId)).limit(1);
    const dateKey = localDateKey(profile?.timeZone ?? "Africa/Lagos");
    const [activity] = await db.select().from(learnerDailyActivities).where(eq(learnerDailyActivities.activityKey, `${preference.userId}:${dateKey}`)).limit(1);
    const decision = getWindowReminderDecision({ lastSentDate: lastSentDateForWindow(preference, window), dateKey, completedMinimum: Boolean(activity?.completedMinimum) });
    if (decision === "already_sent") {
      skipped += 1;
      continue;
    }
    if (decision === "minimum_completed") {
      await db.update(learnerReminderPreferences).set({ lastSentDate: dateKey }).where(eq(learnerReminderPreferences.id, preference.id));
      skipped += 1;
      continue;
    }

    const recovery = Boolean(system?.recoveryPending);
    const copy = REMINDER_WINDOW_COPY[window];
    const results = await sendLearnerPush(
      preference.userId,
      copy.title,
      copy.body(system?.dailyMinimum ?? 10, recovery),
      "/",
    );
    if (results.some((result) => result.delivered)) {
      await db.update(learnerReminderPreferences).set(sentDatePatch(window, dateKey)).where(eq(learnerReminderPreferences.id, preference.id));
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return { window, sent, skipped, totalEnabled: preferences.length };
}

export async function getQuestionSourceCatalogue() {
  const db = await getDb();
  if (!db) return [];
  await db.insert(questionSources).values({
    slug: "model-questions",
    label: "Model Questions · Original JAMB-aligned",
    sourceType: "model",
    permissionNote: "Original model questions created for JAMB Quest; not copied official past-paper wording.",
  }).onDuplicateKeyUpdate({ set: { label: "Model Questions · Original JAMB-aligned" } });
  return db.select().from(questionSources);
}

type AuthorisedPlayableRow = {
  id: number;
  externalId?: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  optionsJson: string;
  answerIndex: number;
  explanation: string | null;
  diagramUrl: string | null;
  explanationStatus: "pending" | "approved" | "needs_review";
  sourceLabel: string;
};

const PLAYABLE_SUBJECTS = new Set(["Use of English", "Biology", "Chemistry", "Physics"]);
const EMBEDDED_OPTION_METADATA = /(?:✓|©|\bcorrect\s+answer\s*:|\bexplanation\s*:|\bwhy\s+others?\s+are\s+wrong\s*:)/i;

export function hasEmbeddedOptionMetadata(option: string) {
  return EMBEDDED_OPTION_METADATA.test(option);
}

const DIAGRAM_REFERENCE = /(?:\[(?:diagram|refers to .*diagram)\b|diagram\s+(?:above|below|shown|illustrated)|illustration\s+(?:above|below|shown)|figure\s+(?:above|below|shown)|\b(?:use|from)\s+the\s+diagram\b|\b(?:structure|compound|graph)\s+above\b|\bgraph\s+shown\b|\brate\s+of\s+reaction\s+diagram\b)/i;
const TEXTUAL_STRUCTURE_EVIDENCE = /(?:\[structure\]|(?:\bCH\d*|\bH\d*C)\s*(?:[-–—=]|\()|C\(=O\)|CH\(OH\))/i;
const OWNER_REJECTED_SCREENSHOT_BATCH = /^OWNER-(?:PHY|CHEM|BIO)-DIAGRAM-/;
const RECOVERED_OWNER_ORIGINAL_ASSET = /^\/manus-storage\/owner-(?:phy|chem|bio)-diagram-/i;

export function requiresDiagramAsset(questionText: string) {
  return DIAGRAM_REFERENCE.test(questionText) && !TEXTUAL_STRUCTURE_EVIDENCE.test(questionText);
}

export function normaliseQuestionStem(questionText: string) {
  return questionText.replace(/^\s*\[diagram question\]\s*/i, "").trim();
}

export function toPlayableAuthorisedQuestion(row: AuthorisedPlayableRow) {
  if (!PLAYABLE_SUBJECTS.has(row.subject)) return null;
  // Reconstructed screenshot-batch visuals are rejected. These records may return only with
  // a recovered owner-original asset, never with a generated replacement URL.
  if (row.externalId && OWNER_REJECTED_SCREENSHOT_BATCH.test(row.externalId) && (!row.diagramUrl || !RECOVERED_OWNER_ORIGINAL_ASSET.test(row.diagramUrl))) return null;
  try {
    const questionText = normaliseQuestionStem(row.questionText);
    const options = JSON.parse(row.optionsJson);
    if (!Array.isArray(options) || options.length < 4 || options.length > 5 || options.some((option) => typeof option !== "string" || !option.trim() || hasEmbeddedOptionMetadata(option))) return null;
    if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex >= options.length) return null;
    const mappedTopic = resolveSyllabusTopic(row.subject as SyllabusSubject, row.topic);
    if (!mappedTopic) return null;
    if (requiresDiagramAsset(questionText) && !row.diagramUrl) return null;
    const explanation = row.explanation ?? "";
    const explanationLines = explanation.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const readingTextWithoutExplanation = row.subject === "Use of English" && mappedTopic === "Approved reading text" && explanationLines.length === 0;
    if (!readingTextWithoutExplanation && explanationLines.length > 5) return null;
    const learnerTopic = row.subject === "Use of English" && mappedTopic === "Approved reading text" && row.topic.startsWith("The Lekki Headmaster") ? row.topic : mappedTopic;
    return {
      id: `authorised-${row.id}`,
      subject: row.subject as "Use of English" | "Biology" | "Chemistry" | "Physics",
      topic: learnerTopic,
      subtopic: "Owner-provided source",
      difficulty: row.difficulty,
      question_type: "multiple_choice" as const,
      question: questionText,
      options,
      answer_index: row.answerIndex,
      answer_text: options[row.answerIndex],
      explanation: row.explanation ?? "Answer mapped from the owner-provided source; verification-pending wording is labelled in the source ledger.",
      diagram_url: row.diagramUrl ?? undefined,
      tags: ["owner-provided", "verification-pending"],
      source: row.sourceLabel,
    };
  } catch {
    return null;
  }
}

export async function getPlayableAuthorisedQuestions() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: questionItems.id,
    externalId: questionItems.externalId,
    subject: questionItems.subject,
    topic: questionItems.topic,
    difficulty: questionItems.difficulty,
    questionText: questionItems.questionText,
    optionsJson: questionItems.optionsJson,
    answerIndex: questionItems.answerIndex,
    explanation: questionItems.explanation,
    diagramUrl: questionItems.diagramUrl,
    explanationStatus: questionItems.explanationStatus,
    sourceLabel: questionSources.label,
  }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));
  return rows.map(toPlayableAuthorisedQuestion).filter((question): question is NonNullable<typeof question> => question !== null);
}

export async function importAuthorisedQuestionSet(userId: number, input: AuthorisedQuestionImport) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const sourceSlug = `authorised-${userId}-${Date.now()}`;
  const createdSources = await db.insert(questionSources).values({
    slug: sourceSlug,
    label: input.sourceLabel,
    sourceType: "authorised",
    permissionNote: input.permissionNote,
  }).$returningId();
  const sourceId = createdSources[0]?.id;
  if (!sourceId) throw new Error("Could not create the authorised question source");

  const createdImports = await db.insert(questionImports).values({
    sourceId,
    uploadedByUserId: userId,
    fileName: input.fileName,
    storageKey: input.storageKey,
    importStatus: "validated",
    questionCount: input.questions.length,
  }).$returningId();
  const importId = createdImports[0]?.id;
  if (!importId) throw new Error("Could not create the authorised question import record");

  const questionRows = input.questions.map((question) => ({
    sourceId,
    externalId: question.externalId,
    subject: question.subject,
    topic: resolveSyllabusTopic(question.subject as SyllabusSubject, question.topic) ?? question.topic,
    difficulty: question.difficulty,
    questionText: question.question,
    optionsJson: JSON.stringify(question.options),
    answerIndex: question.answerIndex,
    explanation: question.explanation ?? null,
  }));
  for (let index = 0; index < questionRows.length; index += 100) {
    await db.insert(questionItems).values(questionRows.slice(index, index + 100));
  }

  await db.update(questionImports).set({ importStatus: "imported" }).where(eq(questionImports.id, importId));

  return {
    importId,
    sourceId,
    sourceLabel: input.sourceLabel,
    sourceType: "authorised" as const,
    questionCount: input.questions.length,
    status: "imported" as const,
  };
}
