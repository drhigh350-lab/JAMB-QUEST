import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, explanation: questionItems.explanation, sourceLabel: questionSources.label })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const banned = ["verification pending", "this question tests your understanding", "revisit", "before moving to the next question", "read the key wording"];
const results = rows.map((row) => {
  const explanation = row.explanation ?? "";
  const lines = explanation.split(/\r?\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const phrase = banned.find((value) => explanation.toLowerCase().includes(value));
  return { ...row, wordCount, sentenceOrLineCount: lines.length, status: lines.length >= 6 && wordCount >= 75 && !phrase ? "approved" : "needs_review", reason: phrase ? `generic-or-placeholder phrase: ${phrase}` : lines.length >= 6 && wordCount >= 75 ? null : "requires at least six sentences or lines and 75 words" };
});
const grouped = Object.groupBy(results, ({ sourceLabel }) => sourceLabel);
const report = { total: results.length, approved: results.filter((result) => result.status === "approved").length, needsReview: results.filter((result) => result.status === "needs_review").length, sources: Object.fromEntries(Object.entries(grouped).map(([sourceLabel, entries]) => [sourceLabel, { total: entries?.length ?? 0, approved: entries?.filter((entry) => entry.status === "approved").length ?? 0, needsReview: entries?.filter((entry) => entry.status === "needs_review").length ?? 0 }])) };
await writeFile("/home/ubuntu/jamb-quiz-game/authorised-explanation-quality-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
