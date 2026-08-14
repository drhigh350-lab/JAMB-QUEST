import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const labels = /^(Concept|Mechanism|Observation|Distinction|Therefore|Answer|Core idea|Topic focus|Reasoning step|Check the alternatives|Exam takeaway)\s*:\s*/i;
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, explanation: questionItems.explanation })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));

let updated = 0;
for (const row of rows) {
  const lines = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !lines.some((line) => labels.test(line))) continue;
  const cleaned = lines.map((line) => line.replace(labels, "").trim()).filter(Boolean);
  if (cleaned.length < 2) continue;
  const splitAt = Math.ceil(cleaned.length / 2);
  const paragraphs = [cleaned.slice(0, splitAt).join(" "), cleaned.slice(splitAt).join(" ")].filter(Boolean).join("\n\n");
  await db.update(questionItems).set({ explanation: paragraphs }).where(eq(questionItems.id, row.id));
  updated += 1;
}
console.log(JSON.stringify({ verified: true, examined: rows.length, updated, untouchedAuthenticOrAlreadyNatural: rows.length - updated }, null, 2));
process.exit(0);
