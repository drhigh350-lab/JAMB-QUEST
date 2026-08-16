import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { inferVerifiedTopic, type TopicSubject } from "../shared/topicInference";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type RawRecord = {
  sourceRow: number;
  externalId: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficultyRating: string;
  question: string;
  options: string[];
  optionLabels: string[];
  answerIndex: number;
  correctOption: string;
  explanation: string;
  source: string;
  examBody: string;
  year: string;
};

type StagedRecord = {
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

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const activeSubjects = new Set<SyllabusSubject>(["Use of English", "Biology", "Chemistry", "Physics"]);
const metadataPattern = /(?:✓|©|\bcorrect\s+answer\s*:|\bexplanation\s*:|\bwhy\s+others?\s+are\s+wrong\s*:)/i;
const raw = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/questions_rows_1.raw.json", "utf8")) as RawRecord[];
const modelPayload = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json", "utf8")) as { questions?: Array<{ subject?: string; question?: string; id?: string }> };
const classifiedMappings = JSON.parse(await readFile("reports/questions_rows_1_topic_classification.json", "utf8")) as { records?: Array<{ externalId: string; suggestedTopic: string | null }> };
const mappingOverrides = new Map((classifiedMappings.records ?? []).filter((record) => record.suggestedTopic).map((record) => [record.externalId, record.suggestedTopic!]));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const authorised = await db
  .select({ subject: questionItems.subject, question: questionItems.questionText, id: questionItems.externalId })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));

const fingerprints = new Map<string, { bank: "model" | "authorised"; id: string }>();
for (const question of modelPayload.questions ?? []) {
  if (!question.subject || !question.question || !activeSubjects.has(question.subject as SyllabusSubject)) continue;
  fingerprints.set(`${question.subject}:${normalise(question.question)}`, { bank: "model", id: question.id ?? "model-question" });
}
for (const question of authorised) {
  if (!activeSubjects.has(question.subject as SyllabusSubject)) continue;
  fingerprints.set(`${question.subject}:${normalise(question.question)}`, { bank: "authorised", id: question.id });
}

function mapTopic(record: RawRecord): string | null {
  const subject = record.subject as TopicSubject;
  if (!activeSubjects.has(subject)) return null;
  return resolveSyllabusTopic(subject, record.topic)
    ?? resolveSyllabusTopic(subject, record.subtopic)
    ?? (inferVerifiedTopic(subject, record.question) ? resolveSyllabusTopic(subject, inferVerifiedTopic(subject, record.question)!) : null);
}

function difficulty(value: string): "easy" | "medium" | "hard" {
  const rating = Number(value);
  if (Number.isFinite(rating) && rating <= 2) return "easy";
  if (Number.isFinite(rating) && rating >= 5) return "hard";
  return "medium";
}

const seen = new Set<string>();
const release: StagedRecord[] = [];
const duplicates: Array<{ sourceRow: number; externalId: string; matchingBank: string; matchingId: string }> = [];
const holds: Array<{ sourceRow: number; externalId: string; reason: string }> = [];
for (const record of raw) {
  if (!activeSubjects.has(record.subject as SyllabusSubject)) {
    holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: `unsupported subject: ${record.subject}` });
    continue;
  }
  const subject = record.subject as SyllabusSubject;
  const fingerprint = `${subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) {
    duplicates.push({ sourceRow: record.sourceRow, externalId: record.externalId, matchingBank: "submitted CSV", matchingId: "earlier row" });
    continue;
  }
  seen.add(fingerprint);
  const existing = fingerprints.get(fingerprint);
  if (existing) {
    duplicates.push({ sourceRow: record.sourceRow, externalId: record.externalId, matchingBank: existing.bank, matchingId: existing.id });
    continue;
  }
  const topic = mappingOverrides.get(record.externalId) ?? mapTopic(record);
  const normalisedOptions = record.options.map(normalise);
  if (!record.question.trim()) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "missing question stem" });
  else if (!topic) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "no safe official syllabus mapping" });
  else if (record.options.length < 4 || record.options.length > 5) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: `expected four or five options, found ${record.options.length}` });
  else if (record.options.some((option) => !option.trim() || metadataPattern.test(option))) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "blank or metadata-contaminated option" });
  else if (new Set(normalisedOptions).size !== normalisedOptions.length) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "duplicate option text" });
  else if (record.answerIndex < 0 || record.answerIndex >= record.options.length) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "answer key cannot be aligned to options" });
  else if (!record.explanation.trim() || record.explanation.length > 4000) holds.push({ sourceRow: record.sourceRow, externalId: record.externalId, reason: "missing or oversized supplied explanation" });
  else release.push({
    externalId: `csv-aug16-${record.externalId}`,
    subject,
    topic,
    difficulty: difficulty(record.difficultyRating),
    question: record.question,
    options: record.options,
    answerIndex: record.answerIndex,
    explanation: record.explanation,
    sourceLabel: `JAMB Quest CSV · ${record.source || "Owner-provided"} · ${subject} · August 2026`,
    permissionNote: "Owner-provided CSV supplied for direct JAMB Quest use. Original answer keys and explanations are retained; duplicate prevention, card-shape integrity, and official syllabus mapping are applied for reliable gameplay.",
  });
}

const report = {
  incoming: raw.length,
  modelBankFingerprints: (modelPayload.questions ?? []).length,
  authorisedBankFingerprints: authorised.length,
  releaseReady: release.length,
  duplicates,
  holds,
  bySubject: Object.fromEntries([...new Set(release.map((record) => record.subject))].sort().map((subject) => [subject, release.filter((record) => record.subject === subject).length])),
};
await writeFile("/home/ubuntu/jamb-import-staging/questions_rows_1.duplicate_safe_staged.json", JSON.stringify(release, null, 2) + "\n");
await writeFile("reports/questions_rows_1_duplicate_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ incoming: report.incoming, releaseReady: report.releaseReady, duplicates: report.duplicates.length, holds: report.holds.length, bySubject: report.bySubject }, null, 2));
