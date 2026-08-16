import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Normalized = {
  externalId: string;
  sourceId: string;
  subject: SyllabusSubject;
  topicLabel: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerLetter: string;
  explanation: string;
  source: string;
  year: string;
  lifecycle: string;
};
type Staged = {
  externalId: string;
  subject: SyllabusSubject;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};

const inputPath = "/home/ubuntu/jamb-import-staging/final_csv_aug16_normalized.json";
const stagePath = "/home/ubuntu/jamb-import-staging/final_csv_aug16_staged.json";
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/final_csv_stage_audit_aug16.json";
const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const sourceLabel = "Kairo · user-supplied final CSV · August 2026";
const permissionNote = "User-supplied CSV export from the Kairo question table for JAMB Quest intake. Only live records passing full-bank duplicate prevention, official JAMB syllabus resolution, four-or-five-option integrity, answer-index alignment, and compact explanation checks are released.";

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
function normaliseStem(value: string) {
  return clean(value).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}

const payload = JSON.parse(await readFile(inputPath, "utf8")) as { records: Normalized[] };
const model = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: Array<{ id?: string; subject?: string; question?: string }> };
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const authorised = await db
  .select({ subject: questionItems.subject, question: questionItems.questionText, id: questionItems.externalId })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));
const fingerprints = new Map<string, { bank: "model" | "authorised"; id: string }>();
for (const row of model.questions ?? []) {
  if (row.subject && row.question) fingerprints.set(`${row.subject}:${normaliseStem(row.question)}`, { bank: "model", id: row.id ?? "model" });
}
for (const row of authorised) {
  if (row.subject && row.question) fingerprints.set(`${row.subject}:${normaliseStem(row.question)}`, { bank: "authorised", id: row.id });
}
const seen = new Set<string>();
const staged: Staged[] = [];
const duplicates: Array<{ sourceId: string; bank: string; matchingId: string }> = [];
const holds: Array<{ sourceId: string; subject: string; reason: string }> = [];
for (const row of payload.records) {
  const fingerprint = `${row.subject}:${normaliseStem(row.question)}`;
  if (seen.has(fingerprint)) { duplicates.push({ sourceId: row.sourceId, bank: "same CSV intake", matchingId: "earlier CSV row" }); continue; }
  seen.add(fingerprint);
  const existing = fingerprints.get(fingerprint);
  if (existing) { duplicates.push({ sourceId: row.sourceId, bank: existing.bank, matchingId: existing.id }); continue; }
  const topic = resolveSyllabusTopic(row.subject, row.topicLabel);
  const answerIndex = row.answerLetter.charCodeAt(0) - 65;
  if (clean(row.lifecycle) && clean(row.lifecycle).toLowerCase() !== "live") holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "record lifecycle is not live" });
  else if (!row.question || row.question.length < 8) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "missing or too-short question" });
  else if (row.options.length < 4 || row.options.length > 5) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "question does not have four or five options" });
  else if (new Set(row.options.map(normaliseStem)).size !== row.options.length) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "duplicate option text" });
  else if (answerIndex < 0 || answerIndex >= row.options.length) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "answer key cannot be aligned to options" });
  else if (!row.explanation || row.explanation.length > 720) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "missing or overlong explanation" });
  else if (!topic) holds.push({ sourceId: row.sourceId, subject: row.subject, reason: "source topic does not resolve to one official JAMB syllabus area" });
  else staged.push({ externalId: row.externalId, subject: row.subject, topic, difficulty: row.difficulty, question: row.question, options: row.options, answerIndex, explanation: row.explanation, sourceLabel, permissionNote });
}
const report = {
  parsedRecords: payload.records.length,
  releaseReady: staged.length,
  duplicateRows: duplicates.length,
  heldRows: holds.length,
  bySubject: Object.fromEntries((["Use of English", "Biology", "Chemistry", "Physics"] as const).map((subject) => [subject, staged.filter((item) => item.subject === subject).length])),
  holdReasons: Object.fromEntries([...new Set(holds.map((item) => item.reason))].map((reason) => [reason, holds.filter((item) => item.reason === reason).length])),
};
await writeFile(stagePath, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify({ ...report, duplicates, holds }, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
