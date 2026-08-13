import { and, eq, inArray, sql } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const expected = new Map([
  ["Owner-provided Markdown · JAMB_Mock_Questions_2026.md · Biology", 47],
  ["Owner-provided Markdown · JAMB_Mock_Questions_2026.md · Biology + Chemistry", 109],
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Biology", 93],
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Chemistry", 83],
  ["Owner-provided Markdown · TechMed_Complete_Question_Bank.md · Physics", 42],
]);
const db = await getDb();
if (!db) throw new Error("Managed database is unavailable");
const labels = [...expected.keys()];
const counts = await db.select({ label: questionSources.label, subject: questionItems.subject, count: sql<number>`count(*)` })
  .from(questionSources).innerJoin(questionItems, eq(questionItems.sourceId, questionSources.id))
  .where(inArray(questionSources.label, labels)).groupBy(questionSources.label, questionItems.subject);
const observed = new Map();
for (const row of counts) {
  observed.set(row.label, (observed.get(row.label) ?? 0) + Number(row.count));
}
for (const [label, count] of expected) {
  if (observed.get(label) !== count) throw new Error(`Unexpected count for ${label}: ${observed.get(label) ?? 0}, expected ${count}`);
}
const duplicateIds = await db.execute(sql`SELECT sourceId, externalId, COUNT(*) AS copies FROM questionItems GROUP BY sourceId, externalId HAVING COUNT(*) > 1`);
if (Array.isArray(duplicateIds) && duplicateIds[0]?.length) throw new Error(`Duplicate external IDs remain: ${JSON.stringify(duplicateIds[0])}`);
const duplicateTexts = await db.execute(sql`SELECT sourceId, questionText, COUNT(*) AS copies FROM questionItems GROUP BY sourceId, questionText HAVING COUNT(*) > 1`);
if (Array.isArray(duplicateTexts) && duplicateTexts[0]?.length) throw new Error(`Duplicate question text remains within a source: ${JSON.stringify(duplicateTexts[0])}`);
const overlap = await db.execute(sql`SELECT COUNT(*) AS copies FROM questionItems oldItems JOIN questionItems newItems ON oldItems.questionText = newItems.questionText WHERE oldItems.sourceId = (SELECT id FROM questionSources WHERE label = 'Owner-provided Markdown · JAMB_Mock_Questions_2026.md · Biology + Chemistry') AND oldItems.subject = 'Biology' AND newItems.sourceId = (SELECT id FROM questionSources WHERE label = 'Owner-provided Markdown · JAMB_Mock_Questions_2026.md · Biology')`);
const overlapRows = Array.isArray(overlap) ? overlap[0] : [];
if (Number(overlapRows?.[0]?.copies ?? 0) !== 0) throw new Error(`JAMB Mock Biology overlap remains: ${JSON.stringify(overlapRows)}`);
console.log(JSON.stringify({ verified: true, observed: Object.fromEntries(observed), duplicateExternalIds: 0, duplicateTextsWithinSource: 0, jambMockBiologyOverlap: 0 }, null, 2));
process.exit(0);
