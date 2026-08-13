import { and, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const enrichmentPath = process.argv[2];
const queuePath = process.argv[3];
if (!enrichmentPath || !queuePath) throw new Error("Usage: pnpm tsx scripts/syncSubmittedRichStyleEnrichments.mts <style-output-json> <queue-input-json>");
const enrichments = JSON.parse(await readFile(enrichmentPath, "utf8")) as Array<{ id: string; subject: string; lines: string[]; quality_gate: boolean; needs_review: boolean; style_reference_used: boolean }>;
const queued = JSON.parse(await readFile(queuePath, "utf8")) as Array<{ id: string; subject: string; topic: string; question: string; options: string[]; answer_index: number; sourceLabel: string }>;
const queueById = new Map(queued.map((record) => [record.id, record]));
const approved = enrichments.filter((record) => record.quality_gate && !record.needs_review && record.style_reference_used && record.lines.length === 6);
const db = await getDb();
if (!db) throw new Error("Database unavailable");

let inserted = 0;
let updated = 0;
const missingSources: string[] = [];
for (const enrichment of approved) {
  const sourceRecord = queueById.get(enrichment.id);
  if (!sourceRecord) throw new Error(`Missing source data for ${enrichment.id}`);
  const [source] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceRecord.sourceLabel)).limit(1);
  if (!source) {
    missingSources.push(sourceRecord.sourceLabel);
    continue;
  }
  const [existing] = await db.select({ id: questionItems.id }).from(questionItems).where(and(eq(questionItems.sourceId, source.id), eq(questionItems.externalId, sourceRecord.id))).limit(1);
  const values = { explanation: enrichment.lines.join("\n"), explanationStatus: "approved" as const };
  if (existing) {
    await db.update(questionItems).set(values).where(eq(questionItems.id, existing.id));
    updated += 1;
  } else {
    await db.insert(questionItems).values({
      sourceId: source.id,
      externalId: sourceRecord.id,
      subject: sourceRecord.subject,
      topic: sourceRecord.topic,
      difficulty: "medium",
      questionText: sourceRecord.question,
      optionsJson: JSON.stringify(sourceRecord.options),
      answerIndex: sourceRecord.answer_index,
      ...values,
    });
    inserted += 1;
  }
}
if (missingSources.length) throw new Error(`Expected source labels were unavailable: ${JSON.stringify([...new Set(missingSources)])}`);
console.log(JSON.stringify({ verified: true, styleConditionedApproved: approved.length, inserted, updated, modelHeldForReview: enrichments.length - approved.length, sourceAmbiguitiesStillHeld: 8 }, null, 2));
