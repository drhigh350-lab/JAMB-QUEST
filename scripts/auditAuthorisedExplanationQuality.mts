import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, explanation: questionItems.explanation, sourceLabel: questionSources.label, explanationStatus: questionItems.explanationStatus })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const banned = ["verification pending", "this question tests your understanding", "revisit", "before moving to the next question", "read the key wording", "⚠", "strictly speaking", "consider swapping", "worth a footnote", "double-check", "two nearly-identical", "doesn't by itself prove", "isn't an exact match", "technically be"];
const results = rows.map((row) => {
  const explanation = row.explanation ?? "";
  const lines = explanation.split(/\r?\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const phrase = banned.find((value) => explanation.toLowerCase().includes(value));
  const enoughStructure = (lines.length >= 6 && wordCount >= 75) || (lines.length >= 2 && wordCount >= 65);
  const contentStatus = enoughStructure && !phrase ? "approved" : "needs_review";
  return { ...row, wordCount, sentenceOrLineCount: lines.length, contentStatus, statusMatchesStored: contentStatus === row.explanationStatus, reason: phrase ? `generic-or-ambiguity phrase: ${phrase}` : enoughStructure ? null : "requires either six readable lines and 75 words, or two substantial explanatory sentences and 65 words" };
});
const grouped = Object.groupBy(results, ({ sourceLabel }) => sourceLabel);
const report = {
  total: results.length,
  approved: results.filter((result) => result.contentStatus === "approved").length,
  needsReview: results.filter((result) => result.contentStatus === "needs_review").length,
  storedStatusMismatches: results.filter((result) => !result.statusMatchesStored).length,
  sources: Object.fromEntries(Object.entries(grouped).map(([sourceLabel, entries]) => [sourceLabel, { total: entries?.length ?? 0, approved: entries?.filter((entry) => entry.contentStatus === "approved").length ?? 0, needsReview: entries?.filter((entry) => entry.contentStatus === "needs_review").length ?? 0 }])),
};
await writeFile("/home/ubuntu/jamb-quiz-game/authorised-explanation-quality-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(0);
