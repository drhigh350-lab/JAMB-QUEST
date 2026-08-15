import { and, eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { naturalExplanationReasons } from "../server/explanationStyle";

type ManifestRecord = { id: string; subject: string; needs_review: boolean; style_reference_used: boolean };
const manifestPath = "/home/ubuntu/jamb-import-staging/submitted_rich_questions.short-enrichment.style-conditioned.output.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ManifestRecord[];
const db = await getDb();
if (!db) throw new Error("Database is unavailable.");

const ids = [...new Set(manifest.map((record) => record.id))];
const rows = await db
  .select({ externalId: questionItems.externalId, explanationStatus: questionItems.explanationStatus, explanation: questionItems.explanation, sourceLabel: questionSources.label, sourceActive: questionSources.isActive })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(inArray(questionItems.externalId, ids), eq(questionSources.sourceType, "authorised")));
const rowByExternalId = new Map(rows.map((row) => [row.externalId, row]));

const records = manifest.map((record) => {
  const stored = rowByExternalId.get(record.id);
  const reasons = stored ? naturalExplanationReasons(stored.explanation ?? "") : [];
  const status = !stored ? "not_released" : stored.sourceActive !== 1 || stored.explanationStatus !== "approved" ? "withheld" : reasons.length ? "needs_style_review" : "regenerated_and_active";
  return { externalId: record.id, subject: record.subject, manifestNeedsReview: record.needs_review, styleReferenceUsed: record.style_reference_used, status, sourceLabel: stored?.sourceLabel ?? null, storedExplanationStatus: stored?.explanationStatus ?? null, styleReasons: reasons };
});
const summary = records.reduce<Record<string, number>>((counts, record) => {
  counts[record.status] = (counts[record.status] ?? 0) + 1;
  return counts;
}, {});
const report = {
  auditedAt: new Date().toISOString(),
  purpose: "Classifies the explicitly traceable style-conditioned legacy generated explanation manifest. Owner-supplied sources without a generation manifest are not labelled as AI-written by inference.",
  manifestPath,
  manifestRecordCount: manifest.length,
  matchedDatabaseRecordCount: rows.length,
  summary,
  records,
};
await writeFile("/home/ubuntu/jamb-quiz-game/reports/legacy_generated_explanation_provenance.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ manifestRecordCount: manifest.length, matchedDatabaseRecordCount: rows.length, summary }, null, 2));
