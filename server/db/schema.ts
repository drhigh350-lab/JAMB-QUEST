import { mysqlTable, serial, varchar, text, datetime, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  createdAt: datetime("created_at").defaultNow(),
  updatedAt: datetime("updated_at").defaultNow().onUpdateNow(),
});

export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 100 }),
  topic: varchar("topic", { length: 255 }),
  question: text("question"),
  options: json("options"),
  correctAnswer: varchar("correct_answer", { length: 10 }),
  explanation: text("explanation"),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: datetime("created_at").defaultNow(),
});

export const userProgress = mysqlTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  questionId: serial("question_id").references(() => questions.id),
  userAnswer: varchar("user_answer", { length: 10 }),
  isCorrect: varchar("is_correct", { length: 5 }),
  timeSpent: serial("time_spent"),
  attemptedAt: datetime("attempted_at").defaultNow(),
});
