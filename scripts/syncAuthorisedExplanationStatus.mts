import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, explanation: questionItems.explanation })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const banned = ["verification pending", "this question tests your understanding", "revisit", "before moving to the next question", "read the key wording"];
const approvedIds: number[] = [];
const reviewIds: number[] = [];
for (const row of rows) {
  const explanation = row.explanation ?? "";
  const lines = explanation.split(/\r?\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const approved = lines.length >= 6 && wordCount >= 75 && !banned.some((phrase) => explanation.toLowerCase().includes(phrase));
  (approved ? approvedIds : reviewIds).push(row.id);
}
for (const ids of [approvedIds, reviewIds]) {
  const status = ids === approvedIds ? "approved" : "needs_review";
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    for (const id of batch) await db.update(questionItems).set({ explanationStatus: status }).where(eq(questionItems.id, id));
  }
}
console.log(JSON.stringify({ total: rows.length, approved: approvedIds.length, needsReview: reviewIds.length }, null, 2));
process.exit(0);
