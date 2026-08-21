import { readFile, writeFile } from "node:fs/promises";
import { inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const batches = [8, 9, 10, 11].map((batch) => `${ROOT}/reports/explanations_batch${batch}_rectified_literal_audit.json`);
const bankPath = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v2.json";
const outputPath = `${ROOT}/reports/rectified_batches_gate_audit.json`;
const genericEnding = /compare each option with the exact condition|other options do not satisfy the same relationship|main skill tested is identifying the governing physical relationship/i;
const rawMarkup = /\\(?:frac|text|sqrt|times|cdot|leq|geq|rightarrow|left|right|circ|alpha|beta|gamma|Delta)|\$[^$]+\$/;

type Audit = { source: string; recordCount: number; explanations: Record<string, string> };
const audits = await Promise.all(batches.map(async (path) => JSON.parse(await readFile(path, "utf8")) as Audit));
const allEntries = audits.flatMap((audit, batchIndex) => Object.entries(audit.explanations).map(([id, explanation]) => ({ batch: batchIndex + 8, source: audit.source, id, explanation })));
const byId = new Map<string, typeof allEntries>();
for (const entry of allEntries) byId.set(entry.id, [...(byId.get(entry.id) ?? []), entry]);
const duplicateIds = [...byId.entries()].filter(([, entries]) => entries.length > 1).map(([id, entries]) => ({ id, batches: entries.map((entry) => entry.batch) }));
const modelBank = JSON.parse(await readFile(bankPath, "utf8")) as { questions?: Array<{ id?: string; record_id?: string }> };
const modelIds = new Set((modelBank.questions ?? []).map((question) => String(question.id ?? question.record_id)));
const modelEntries = allEntries.filter((entry) => entry.id.startsWith("PHY-"));
const missingModelIds = modelEntries.filter((entry) => !modelIds.has(entry.id)).map((entry) => entry.id);
const authorisedEntries = allEntries.filter((entry) => entry.id.startsWith("authorised-"));
const genericIds = allEntries.filter((entry) => genericEnding.test(entry.explanation)).map((entry) => entry.id);
const rawMarkupIds = allEntries.filter((entry) => rawMarkup.test(entry.explanation)).map((entry) => entry.id);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const authorisedNumericIds = authorisedEntries.map((entry) => Number(entry.id.replace(/^authorised-/, ""))).filter(Number.isInteger);
const dbRows = authorisedNumericIds.length ? await db.select({ id: questionItems.id, subject: questionItems.subject }).from(questionItems).where(inArray(questionItems.id, authorisedNumericIds)) : [];
const dbIdSet = new Set(dbRows.map((row) => Number(row.id)));
const missingAuthorisedIds = authorisedEntries.filter((entry) => !dbIdSet.has(Number(entry.id.replace(/^authorised-/, "")))).map((entry) => entry.id);
const report = {
  sources: audits.map((audit) => audit.source),
  totalRecords: allEntries.length,
  countsByBatch: Object.fromEntries(audits.map((audit, index) => [`batch${index + 8}`, audit.recordCount])),
  duplicateIds,
  missingModelIds,
  missingAuthorisedIds,
  genericIds,
  rawMarkupIds,
  modelRecordCount: modelEntries.length,
  authorisedRecordCount: authorisedEntries.length,
  authorisedDatabaseMatches: dbRows.length,
  releaseEligibleBeforeQualityReview: duplicateIds.length === 0 && missingModelIds.length === 0 && missingAuthorisedIds.length === 0 && rawMarkupIds.length === 0,
  note: "Generic-template findings are reported for review; rectified batches are not imported until this gate and subject/status policy are reviewed.",
};
await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ ...report, genericIds: genericIds.length, rawMarkupIds: rawMarkupIds.length }, null, 2));
