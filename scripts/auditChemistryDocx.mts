import { readFile, writeFile } from "node:fs/promises";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { inferVerifiedTopic } from "../shared/topicInference";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

const payload = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_parsed.json", "utf8"));
const records = payload.records as Array<{ externalId: string; question: string; options: string[]; answerIndex: number | null; answerKey: string | null; sourceExplanation: string }>;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const topicFor = (question: string) => {
  const inferred = inferVerifiedTopic("Chemistry", question);
  return resolveSyllabusTopic("Chemistry", inferred ?? "") ?? null;
};
const db = await getDb();
if (!db) throw new Error("Database is unavailable.");
const stored = await db.select({ question: questionItems.questionText, subject: questionItems.subject }).from(questionItems);
const storedChemistry = new Set(stored.filter((row) => row.subject === "Chemistry").map((row) => normalize(row.question)));
const seen = new Map<string, string>();
const audited = records.map((record) => {
  const key = normalize(record.question);
  const duplicateWithin = seen.get(key) ?? null;
  seen.set(key, record.externalId);
  const duplicateStored = storedChemistry.has(key);
  const mappedTopic = topicFor(record.question);
  const structuralReason = !record.answerKey ? "missing answer key" : record.answerIndex === null || record.answerIndex < 0 || record.answerIndex >= record.options.length ? "answer index outside option range" : record.options.length < 4 || record.options.length > 5 ? "option count is not four or five" : record.options.some((option) => !option.trim()) ? "blank option" : null;
  return { ...record, mappedTopic, duplicateWithin, duplicateStored, structuralReason, status: structuralReason || duplicateWithin || duplicateStored || !mappedTopic ? "hold" : "candidate" };
});
const report = {
  auditedAt: new Date().toISOString(),
  sourceFile: payload.sourceFile,
  totalRecords: audited.length,
  candidateCount: audited.filter((record) => record.status === "candidate").length,
  holdCount: audited.filter((record) => record.status === "hold").length,
  mappedCount: audited.filter((record) => record.mappedTopic).length,
  unmappedCount: audited.filter((record) => !record.mappedTopic).length,
  duplicateWithinCount: audited.filter((record) => record.duplicateWithin).length,
  duplicateStoredCount: audited.filter((record) => record.duplicateStored).length,
  structuralHoldCount: audited.filter((record) => record.structuralReason).length,
  byTopic: Object.entries(audited.reduce<Record<string, number>>((counts, record) => { if (record.mappedTopic) counts[record.mappedTopic] = (counts[record.mappedTopic] ?? 0) + 1; return counts; }, {})).map(([topic, count]) => ({ topic, count })),
  records: audited,
};
await writeFile("/home/ubuntu/jamb-quiz-game/reports/chemistry_docx_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ totalRecords: report.totalRecords, candidateCount: report.candidateCount, holdCount: report.holdCount, mappedCount: report.mappedCount, unmappedCount: report.unmappedCount, duplicateWithinCount: report.duplicateWithinCount, duplicateStoredCount: report.duplicateStoredCount, structuralHoldCount: report.structuralHoldCount, byTopic: report.byTopic }, null, 2));
