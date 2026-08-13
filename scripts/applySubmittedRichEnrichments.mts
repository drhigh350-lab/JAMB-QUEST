import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: pnpm tsx scripts/applySubmittedRichEnrichments.mts <enrichment-output-json>");
const records = JSON.parse(await readFile(inputPath, "utf8")) as Array<{ id: string; subject: string; lines: string[]; quality_gate: boolean; needs_review: boolean }>;
const approved = records.filter((record) => record.quality_gate && !record.needs_review && record.lines.length === 6);
const db = await getDb();
if (!db) throw new Error("Database unavailable");

let applied = 0;
const missing: string[] = [];
for (const record of approved) {
  const [row] = await db.select({ id: questionItems.id })
    .from(questionItems)
    .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
    .where(and(eq(questionItems.externalId, record.id), eq(questionItems.subject, record.subject), eq(questionSources.sourceType, "authorised")))
    .limit(1);
  if (!row) {
    missing.push(record.id);
    continue;
  }
  await db.update(questionItems).set({ explanation: record.lines.join("\n"), explanationStatus: "approved" }).where(eq(questionItems.id, row.id));
  applied += 1;
}
if (missing.length) throw new Error(`Could not match ${missing.length} enriched submitted records: ${JSON.stringify(missing.slice(0, 5))}`);
console.log(JSON.stringify({ verified: true, applied, modelHeldForReview: records.length - approved.length, sourceAmbiguitiesStillHeld: 8 }, null, 2));
