import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Optional learner-facing settings layered over the authenticated Manus user.
 * The OAuth name remains the default display name until the learner customises it.
 */
export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  displayName: varchar("displayName", { length: 80 }),
  targetScore: int("targetScore").notNull().default(380),
  timeZone: varchar("timeZone", { length: 64 }).notNull().default("Africa/Lagos"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * A compact learner ledger used by the home screen and review-wrongs mode.
 * Wrong question IDs are serialized JSON to keep the game’s 1,000-item bank remote.
 */
export const learnerProgress = mysqlTable("learnerProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  totalAnswered: int("totalAnswered").notNull().default(0),
  totalCorrect: int("totalCorrect").notNull().default(0),
  bestScore: int("bestScore").notNull().default(0),
  lastScore: int("lastScore").notNull().default(0),
  roundsPlayed: int("roundsPlayed").notNull().default(0),
  wrongQuestionIds: text("wrongQuestionIds"),
  subjectBestScores: text("subjectBestScores"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Round history powers a learner’s profile timeline and gives future analytics a reliable event trail.
 */
export const quizRounds = mysqlTable("quizRounds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  subject: varchar("subject", { length: 48 }).notNull(),
  mode: varchar("mode", { length: 24 }).notNull(),
  questionCount: int("questionCount").notNull(),
  correctCount: int("correctCount").notNull(),
  score: int("score").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

/**
 * Provenance records keep original model questions clearly distinct from authorised question sets.
 */
export const questionSources = mysqlTable("questionSources", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["model", "authorised"]).notNull(),
  permissionNote: text("permissionNote"),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Import metadata is stored separately from the file bytes, which remain in project storage.
 */
export const questionImports = mysqlTable("questionImports", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull().references(() => questionSources.id),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  importStatus: mysqlEnum("importStatus", ["pending", "validated", "imported", "rejected"]).notNull().default("pending"),
  questionCount: int("questionCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Imported authorised questions live under their source record and never overwrite the model bank.
 */
export const questionItems = mysqlTable("questionItems", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull().references(() => questionSources.id),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 48 }).notNull(),
  topic: varchar("topic", { length: 160 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull().default("medium"),
  questionText: text("questionText").notNull(),
  optionsJson: text("optionsJson").notNull(),
  answerIndex: int("answerIndex").notNull(),
  explanation: text("explanation"),
  explanationStatus: mysqlEnum("explanationStatus", ["pending", "approved", "needs_review"]).notNull().default("needs_review"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * The learner’s daily study system: target, streak resilience, and the accumulated comeback identity.
 */
export const learnerSystems = mysqlTable("learnerSystems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  dailyMinimum: int("dailyMinimum").notNull().default(10),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  comebackXp: int("comebackXp").notNull().default(0),
  level: int("level").notNull().default(1),
  lastCompletedDate: varchar("lastCompletedDate", { length: 10 }),
  recoveryPending: int("recoveryPending").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * One deterministic record per learner and local study date, shown in the comeback activity graph.
 */
export const learnerDailyActivities = mysqlTable("learnerDailyActivities", {
  id: int("id").autoincrement().primaryKey(),
  activityKey: varchar("activityKey", { length: 96 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  dateKey: varchar("dateKey", { length: 10 }).notNull(),
  questionsAnswered: int("questionsAnswered").notNull().default(0),
  correctCount: int("correctCount").notNull().default(0),
  roundsCompleted: int("roundsCompleted").notNull().default(0),
  xpEarned: int("xpEarned").notNull().default(0),
  completedMinimum: int("completedMinimum").notNull().default(0),
  recoveryAction: int("recoveryAction").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Durable badge claims keep accomplishment feedback meaningful and avoid repeated unlocks.
 */
export const learnerAchievements = mysqlTable("learnerAchievements", {
  id: int("id").autoincrement().primaryKey(),
  claimKey: varchar("claimKey", { length: 128 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  badgeKey: varchar("badgeKey", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

/**
 * Per-learner schedule preferences are retained separately from push permissions and survive device changes.
 */
export const learnerReminderPreferences = mysqlTable("learnerReminderPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  enabled: int("enabled").notNull().default(0),
  reminderTime: varchar("reminderTime", { length: 5 }).notNull().default("19:00"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastSentDate: varchar("lastSentDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Web-push subscriptions are opt-in per browser/device and can be disabled without affecting study data.
 */
export const learnerPushSubscriptions = mysqlTable("learnerPushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  endpointHash: varchar("endpointHash", { length: 128 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  subscriptionJson: text("subscriptionJson").notNull(),
  enabled: int("enabled").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * The app’s VAPID key pair is generated once and stored server-side, never exposed beyond the public key.
 */
export const projectPushConfigs = mysqlTable("projectPushConfigs", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 64 }).notNull().unique(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  subject: varchar("subject", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type LearnerProgress = typeof learnerProgress.$inferSelect;
export type QuizRound = typeof quizRounds.$inferSelect;
export type QuestionSource = typeof questionSources.$inferSelect;
export type QuestionImport = typeof questionImports.$inferSelect;
export type QuestionItem = typeof questionItems.$inferSelect;
export type LearnerSystem = typeof learnerSystems.$inferSelect;
export type LearnerDailyActivity = typeof learnerDailyActivities.$inferSelect;
export type LearnerAchievement = typeof learnerAchievements.$inferSelect;
export type LearnerReminderPreference = typeof learnerReminderPreferences.$inferSelect;
export type LearnerPushSubscription = typeof learnerPushSubscriptions.$inferSelect;
export type ProjectPushConfig = typeof projectPushConfigs.$inferSelect;
