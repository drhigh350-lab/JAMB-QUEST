import { readFile, writeFile } from "node:fs/promises";
import { inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const currentPaths = [12, 13, 14].map((b) => `${ROOT}/reports/explanations_batch${b}_literal_audit.json`);
const priorPaths = [11].map((b) => `${ROOT}/reports/explanations_batch${b}_rectified_literal_audit.json`);
const outputPath = `${ROOT}/reports/batches12_14_gate_audit.json`;
const generic = /compare each option with the exact condition|other options do not satisfy the same relationship|main skill tested is identifying the governing physical relationship/i;
const raw = /\\(?:frac|text|sqrt|times|cdot|leq|geq|rightarrow|left|right|circ|alpha|beta|gamma|Delta)|\$[^$]+\$/;
type Audit = { source: string; explanations: Record<string, string> };
const readJson = async <T>(p: string) => JSON.parse(await readFile(p, "utf8")) as T;
const current = await Promise.all(currentPaths.map((p) => readJson<Audit>(p)));
const prior = await Promise.all(priorPaths.map((p) => readJson<Audit>(p)));
const all = current.flatMap((a, i) => Object.entries(a.explanations).map(([id, explanation]) => ({ batch: i + 12, id, explanation })));
const previous = new Set(prior.flatMap((a) => Object.keys(a.explanations)));
const seen = new Map<string, number[]>();
for (const entry of all) seen.set(entry.id, [...(seen.get(entry.id) ?? []), entry.batch]);
const duplicateWithinUpload = [...seen.entries()].filter(([, batches]) => batches.length > 1).map(([id, batches]) => ({ id, batches }));
const overlapsPrior = all.filter((entry) => previous.has(entry.id)).map((entry) => entry.id);
const genericIds = all.filter((entry) => generic.test(entry.explanation)).map((entry) => entry.id);
const rawMarkupIds = all.filter((entry) => raw.test(entry.explanation)).map((entry) => entry.id);
const numericIds = all.map((entry) => Number(entry.id.replace(/^authorised-/, ""))).filter(Number.isInteger);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, subject: questionItems.subject }).from(questionItems).where(inArray(questionItems.id, numericIds));
const dbSet = new Set(rows.map((row) => Number(row.id)));
const missingDatabaseIds = all.filter((entry) => !dbSet.has(Number(entry.id.replace(/^authorised-/, "")))).map((entry) => entry.id);
const report = {
  sources: current.map((a) => a.source),
  countsByBatch: Object.fromEntries(current.map((a, i) => [`batch${i + 12}`, Object.keys(a.explanations).length])),
  totalRecords: all.length,
  duplicateWithinUpload,
  overlapsPrior,
  genericIds,
  rawMarkupIds,
  missingDatabaseIds,
  databaseMatches: rows.length,
  releaseEligibleBeforeManualReview: duplicateWithinUpload.length === 0 && overlapsPrior.length === 0 && missingDatabaseIds.length === 0 && rawMarkupIds.length === 0,
  note: "Batch 12 overlaps the previously audited Batch 11 ID range and must not be imported as a duplicate. Generic findings remain held until question-specific text is confirmed.",
};
await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ ...report, genericIds: genericIds.length, rawMarkupIds: rawMarkupIds.length, missingDatabaseIds: missingDatabaseIds.length }, null, 2));
