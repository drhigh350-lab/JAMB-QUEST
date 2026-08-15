import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { naturalExplanationReasons } from "../server/explanationStyle";

const db = await getDb();
if (!db) throw new Error("Database is unavailable.");

const records = await db
  .select({ id: questionItems.id, sourceId: questionItems.sourceId, sourceLabel: questionSources.label, subject: questionItems.subject, explanation: questionItems.explanation })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));

const flagged = records.flatMap((record) => {
  const reasons = naturalExplanationReasons(record.explanation ?? "");
  return reasons.length ? [{ questionId: record.id, sourceId: record.sourceId, sourceLabel: record.sourceLabel, subject: record.subject, reasons }] : [];
});
const bySource = Object.entries(
  flagged.reduce<Record<string, number>>((counts, record) => {
    counts[record.sourceLabel] = (counts[record.sourceLabel] ?? 0) + 1;
    return counts;
  }, {}),
).map(([sourceLabel, flaggedCount]) => ({ sourceLabel, flaggedCount }));
const report = { auditedAt: new Date().toISOString(), activeApprovedExplanationCount: records.length, flaggedCount: flagged.length, bySource, flagged };
await writeFile("/home/ubuntu/jamb-quiz-game/reports/active_explanation_style_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ activeApprovedExplanationCount: records.length, flaggedCount: flagged.length, bySource }, null, 2));
