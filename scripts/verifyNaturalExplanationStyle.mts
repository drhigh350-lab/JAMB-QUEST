import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { naturalExplanationReasons } from "../server/explanationStyle";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, explanation: questionItems.explanation })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));
const failures = rows.flatMap((row) => {
  const text = row.explanation ?? "";
  const reasons = naturalExplanationReasons(text);
  return reasons.length ? [{ id: row.id, externalId: row.externalId, reasons }] : [];
});
if (failures.length) throw new Error(`Natural explanation style failed for ${failures.length} active records: ${JSON.stringify(failures.slice(0, 10))}`);
console.log(JSON.stringify({ verified: true, approvedActiveAuthorised: rows.length, rejectedTemplateExplanations: 0 }, null, 2));
process.exit(0);
