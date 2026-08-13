/* Field Notes Arcade: database helpers keep learner identity, revision ledger, question provenance, and comeback system explicit. */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "node:crypto";
import webpush, { type PushSubscription } from "web-push";
import {
  InsertUser,
  learnerAchievements,
  learnerDailyActivities,
  learnerProfiles,
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

let _db: ReturnType<typeof drizzle> | null = null;

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
  reminder: { enabled: boolean; reminderTime: string; pushEnabled: boolean };
  recentRounds: Array<{
    id: number;
    subject: string;
    mode: string;
    questionCount: number;
    correctCount: number;
    score: number;
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

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
  const rounds = await db.select().from(quizRounds).where(eq(quizRounds.userId, userId)).orderBy(quizRounds.completedAt).limit(12);
  const timeZone = profile?.timeZone ?? "Africa/Lagos";
  const dateKey = localDateKey(timeZone);
  const recentActivity = activities.sort((left, right) => left.dateKey.localeCompare(right.dateKey)).slice(-14);
  const today = activities.find((activity) => activity.dateKey === dateKey);
  const completedDays = recentActivity.filter((activity) => activity.completedMinimum).length;

  return {
    profile: { displayName: profile?.displayName ?? fallbackName, targetScore: profile?.targetScore ?? 380, timeZone },
    progress: buildLedgerSnapshot(progress),
    comeback: {
      dailyMinimum: system?.dailyMinimum ?? 10,
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
    reminder: { enabled: Boolean(reminder?.enabled), reminderTime: reminder?.reminderTime ?? "19:00", pushEnabled: Boolean(pushSubscription?.enabled) },
    recentRounds: rounds.reverse().map((round) => ({
      id: round.id,
      subject: round.subject,
      mode: round.mode,
      questionCount: round.questionCount,
      correctCount: round.correctCount,
      score: round.score,
      completedAt: round.completedAt,
    })),
  };
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

export async function recordLearnerRound(userId: number, fallbackName: string | null, input: RoundRecordInput) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const [stored] = await db.select().from(learnerProgress).where(eq(learnerProgress.userId, userId)).limit(1);
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  const [system] = await db.select().from(learnerSystems).where(eq(learnerSystems.userId, userId)).limit(1);
  const current = buildLedgerSnapshot(stored);
  const newWrongIds = Array.from(new Set([...current.wrongIds, ...input.wrongIds.filter((id) => typeof id === "string")])).slice(-80);
  const subjectBest = { ...current.subjectBest, [input.subject]: Math.max(current.subjectBest[input.subject] ?? 0, input.score) };

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
  });

  const timeZone = profile?.timeZone ?? "Africa/Lagos";
  const dateKey = localDateKey(timeZone);
  const activityKey = `${userId}:${dateKey}`;
  const [today] = await db.select().from(learnerDailyActivities).where(eq(learnerDailyActivities.activityKey, activityKey)).limit(1);
  const dailyMinimum = system?.dailyMinimum ?? 10;
  const questionsAnswered = (today?.questionsAnswered ?? 0) + input.questionCount;
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

export async function updateLearnerSystem(userId: number, fallbackName: string | null, update: { dailyMinimum?: number }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  if (update.dailyMinimum !== undefined) await db.update(learnerSystems).set({ dailyMinimum: update.dailyMinimum }).where(eq(learnerSystems.userId, userId));
  return getLearnerDashboard(userId, fallbackName);
}

export async function updateReminderPreferences(userId: number, fallbackName: string | null, update: { enabled?: boolean; reminderTime?: string }) {
  const db = await ensureLearnerRows(userId, fallbackName);
  const set: { enabled?: number; reminderTime?: string } = {};
  if (update.enabled !== undefined) set.enabled = update.enabled ? 1 : 0;
  if (update.reminderTime !== undefined) set.reminderTime = update.reminderTime;
  if (Object.keys(set).length) await db.update(learnerReminderPreferences).set(set).where(eq(learnerReminderPreferences.userId, userId));
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

export async function sendLearnerPush(userId: number, title: string, body: string, url = "/") {
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

export async function sendDailyComebackReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const preferences = await db.select().from(learnerReminderPreferences).where(eq(learnerReminderPreferences.enabled, 1));
  let sent = 0;
  let skipped = 0;

  for (const preference of preferences) {
    const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, preference.userId)).limit(1);
    const [system] = await db.select().from(learnerSystems).where(eq(learnerSystems.userId, preference.userId)).limit(1);
    const dateKey = localDateKey(profile?.timeZone ?? "Africa/Lagos");
    if (preference.lastSentDate === dateKey) {
      skipped += 1;
      continue;
    }
    const [activity] = await db.select().from(learnerDailyActivities).where(eq(learnerDailyActivities.activityKey, `${preference.userId}:${dateKey}`)).limit(1);
    if (activity?.completedMinimum) {
      await db.update(learnerReminderPreferences).set({ lastSentDate: dateKey }).where(eq(learnerReminderPreferences.id, preference.id));
      skipped += 1;
      continue;
    }

    const recovery = Boolean(system?.recoveryPending);
    const results = await sendLearnerPush(
      preference.userId,
      recovery ? "JAMB Quest: your comeback is ready" : "JAMB Quest: run today’s system",
      recovery ? "One small recovery review is enough to restart the rhythm. You are still building 380." : `Your ${system?.dailyMinimum ?? 10}-question system is waiting. Small systems build big scores.`,
      "/",
    );
    if (results.some((result) => result.delivered)) {
      await db.update(learnerReminderPreferences).set({ lastSentDate: dateKey }).where(eq(learnerReminderPreferences.id, preference.id));
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped, totalEnabled: preferences.length };
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
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  optionsJson: string;
  answerIndex: number;
  explanation: string | null;
  sourceLabel: string;
};

const PLAYABLE_SUBJECTS = new Set(["Use of English", "Biology", "Chemistry", "Physics"]);

export function toPlayableAuthorisedQuestion(row: AuthorisedPlayableRow) {
  if (!PLAYABLE_SUBJECTS.has(row.subject)) return null;
  try {
    const options = JSON.parse(row.optionsJson);
    if (!Array.isArray(options) || options.length !== 4 || options.some((option) => typeof option !== "string" || !option.trim())) return null;
    if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex > 3) return null;
    return {
      id: `authorised-${row.id}`,
      subject: row.subject as "Use of English" | "Biology" | "Chemistry" | "Physics",
      topic: row.topic,
      subtopic: "Owner-provided source",
      difficulty: row.difficulty,
      question_type: "multiple_choice" as const,
      question: row.questionText,
      options,
      answer_index: row.answerIndex,
      answer_text: options[row.answerIndex],
      explanation: row.explanation ?? "Answer mapped from the owner-provided source; verification-pending wording is labelled in the source ledger.",
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
    subject: questionItems.subject,
    topic: questionItems.topic,
    difficulty: questionItems.difficulty,
    questionText: questionItems.questionText,
    optionsJson: questionItems.optionsJson,
    answerIndex: questionItems.answerIndex,
    explanation: questionItems.explanation,
    sourceLabel: questionSources.label,
  }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(eq(questionSources.isActive, 1));
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

  await db.insert(questionItems).values(input.questions.map((question) => ({
    sourceId,
    externalId: question.externalId,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    questionText: question.question,
    optionsJson: JSON.stringify(question.options),
    answerIndex: question.answerIndex,
    explanation: question.explanation ?? null,
  })));

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
