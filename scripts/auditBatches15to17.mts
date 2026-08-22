import { readFile, writeFile } from "node:fs/promises";
import { inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const ROOT = "/home/ubuntu/jamb-quiz-game";
const batches = [15, 16, 17] as const;
const auditPaths = batches.map((batch) => `${ROOT}/reports/explanations_batch${batch}_careful_literal_audit.json`);
const outputPath = `${ROOT}/reports/batches15_17_gate_audit.json`;

type ParsedBatch = {
  source: string;
  assignment: string;
  recordCount: number;
  explanations: Record<string, string>;
};

const rawMarkup = /\\(?:frac|text|sqrt|times|cdot|leq|geq|rightarrow|left|right|circ|alpha|beta|gamma|Delta)|\$[^$]+\$/;
const genericTailRules: Array<{ rule: string; regex: RegExp }> = [
  { rule: "generic-deciding-feature-tail", regex: /the deciding feature here is the .+ relationship described in the question\.?/i },
  { rule: "generic-wave-relationship-tail", regex: /the wave relationship v\s*=\s*fλ links speed, frequency and wavelength; use the quantities actually supplied by the question\.?/i },
  { rule: "generic-lens-formula-tail", regex: /lens questions are governed by the lens formula .+ when image size is involved\.?/i },
  { rule: "generic-momentum-tail", regex: /momentum is p\s*=\s*mv, and in an isolated system total momentum is conserved during a collision or interaction\.?/i },
];

const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;
const audits = await Promise.all(auditPaths.map((path) => readJson<ParsedBatch>(path)));
const entries = audits.flatMap((audit, index) => Object.entries(audit.explanations).map(([id, explanation]) => ({ batch: batches[index], id, explanation })));
const byId = new Map<string, typeof entries>();
for (const entry of entries) byId.set(entry.id, [...(byId.get(entry.id) ?? []), entry]);

const duplicateIds = [...byId.entries()]
  .filter(([, matches]) => matches.length > 1)
  .map(([id, matches]) => ({ id, batches: matches.map((match) => match.batch) }));
const nonAuthorisedIds = entries.filter((entry) => !/^authorised-\d+$/.test(entry.id)).map((entry) => entry.id);
const rawMarkupIds = entries.filter((entry) => rawMarkup.test(entry.explanation)).map((entry) => entry.id);
const tooShortIds = entries.filter((entry) => entry.explanation.trim().length < 60).map((entry) => entry.id);
const tooLongIds = entries.filter((entry) => entry.explanation.trim().length > 520).map((entry) => entry.id);
const genericFindings = entries.flatMap((entry) => genericTailRules
  .filter((rule) => rule.regex.test(entry.explanation))
  .map((rule) => ({ id: entry.id, batch: entry.batch, rule: rule.rule })));

const numericIds = entries.map((entry) => Number(entry.id.replace(/^authorised-/, ""))).filter(Number.isInteger);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const databaseRows = numericIds.length
  ? await db.select({ id: questionItems.id, subject: questionItems.subject, explanation: questionItems.explanation }).from(questionItems).where(inArray(questionItems.id, numericIds))
  : [];
const dbIds = new Set(databaseRows.map((row) => Number(row.id)));
const missingDatabaseIds = entries.filter((entry) => !dbIds.has(Number(entry.id.replace(/^authorised-/, "")))).map((entry) => entry.id);
const heldIds = new Set([
  ...nonAuthorisedIds,
  ...rawMarkupIds,
  ...tooShortIds,
  ...tooLongIds,
  ...missingDatabaseIds,
  ...genericFindings.map((finding) => finding.id),
]);
const eligibleEntries = entries.filter((entry) => !heldIds.has(entry.id));

const report = {
  sources: audits.map((audit) => audit.source),
  parsedAsInertLiteralData: true,
  countsByBatch: Object.fromEntries(audits.map((audit, index) => [`batch${batches[index]}`, audit.recordCount])),
  totalRecords: entries.length,
  duplicateIds,
  nonAuthorisedIds,
  rawMarkupIds,
  tooShortIds,
  tooLongIds,
  genericFindings,
  missingDatabaseIds,
  authorisedDatabaseMatches: databaseRows.length,
  eligibleIds: eligibleEntries.map((entry) => entry.id),
  heldIds: [...heldIds].sort(),
  eligibleByBatch: Object.fromEntries(batches.map((batch) => [`batch${batch}`, eligibleEntries.filter((entry) => entry.batch === batch).length])),
  heldByBatch: Object.fromEntries(batches.map((batch) => [`batch${batch}`, entries.filter((entry) => entry.batch === batch && heldIds.has(entry.id)).length])),
  protectedFields: ["question", "options", "answer", "topic", "diagram", "source metadata"],
  note: "Only mapped authorised explanation fields that clear all structural, learner-formatting, and non-generic-text gates may be released. This audit neither executes the supplied Python nor changes question data.",
};

await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({
  totalRecords: report.totalRecords,
  countsByBatch: report.countsByBatch,
  duplicateIds: report.duplicateIds.length,
  nonAuthorisedIds: report.nonAuthorisedIds.length,
  rawMarkupIds: report.rawMarkupIds.length,
  genericFindings: report.genericFindings.length,
  missingDatabaseIds: report.missingDatabaseIds.length,
  eligibleByBatch: report.eligibleByBatch,
  heldByBatch: report.heldByBatch,
}, null, 2));
