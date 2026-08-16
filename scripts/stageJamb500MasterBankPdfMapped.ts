import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { inferVerifiedTopic, type TopicSubject } from "../shared/topicInference";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type Subject = "Use of English" | "Biology" | "Chemistry" | "Physics";
type ParsedRecord = { externalId: string; sourceNumber: number; subject: Subject; suppliedTopic: string; question: string; options: string[]; answerIndex: number; explanation: string };
type StagedRecord = { externalId: string; subject: Subject; topic: string; difficulty: "hard"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };

const sourcePath = "/home/ubuntu/jamb-import-staging/new_pdf_aug16/JAMB_500_QUESTION_MASTER_BANK.txt";
const stagePath = "/home/ubuntu/jamb-import-staging/jamb_500_master_bank.duplicate_safe_staged.json";
const reportPath = "reports/jamb_500_master_bank_pdf_audit.json";
const classificationPath = "reports/jamb_500_master_bank_topic_classification.json";
const subjects = new Set<Subject>(["Use of English", "Biology", "Chemistry", "Physics"]);
const subjectSlug: Record<Subject, string> = { "Use of English": "english", Biology: "biology", Chemistry: "chemistry", Physics: "physics" };

function normaliseStem(value: string) {
  return value.toLocaleLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

function normaliseOption(value: string) {
  return value.toLocaleLowerCase().normalize("NFKC").replace(/[–—]/g, "-").trim().replace(/\s+/g, " ");
}

const text = await readFile(sourcePath, "utf8");
const records: ParsedRecord[] = [];
let subject: Subject | null = null;
let suppliedTopic = "";
let current: Omit<ParsedRecord, "externalId" | "subject" | "suppliedTopic"> | null = null;
function flush() {
  if (!subject || !current || current.answerIndex < 0) return;
  records.push({ ...current, subject, suppliedTopic, externalId: `jamb-500-master-${subjectSlug[subject]}-${String(current.sourceNumber).padStart(3, "0")}` });
  current = null;
}
for (const rawLine of text.split(/\r?\n/)) {
  const line = rawLine.trim();
  const subjectMatch = line.match(/^(Use of English|Chemistry|Biology|Physics)\s+—\s+100\s+QUESTIONS$/i);
  if (subjectMatch) {
    flush();
    const value = subjectMatch[1] === "Use of English" ? "Use of English" : `${subjectMatch[1][0].toUpperCase()}${subjectMatch[1].slice(1).toLowerCase()}`;
    subject = subjects.has(value as Subject) ? value as Subject : null;
    suppliedTopic = "";
    continue;
  }
  if (!subject || !line || /Master Bank.*Page \d+/i.test(line)) continue;
  const topicMatch = line.match(/^Topic:\s*(.+)$/i);
  if (topicMatch && !current) {
    suppliedTopic = topicMatch[1].trim();
    continue;
  }
  const questionMatch = line.match(/^(\d{1,3})\.\s+(.+)$/);
  if (questionMatch) {
    flush();
    current = { sourceNumber: Number(questionMatch[1]), question: questionMatch[2].trim(), options: [], answerIndex: -1, explanation: "" };
    continue;
  }
  if (!current) continue;
  const optionMatch = line.match(/^([A-E])\.\s+(.+)$/);
  if (optionMatch) {
    current.options.push(optionMatch[2].trim());
    continue;
  }
  const answerMatch = line.match(/^Answer:\s*([A-E])\s*\|\s*Topic:\s*(.+)$/i);
  if (answerMatch) {
    current.answerIndex = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
    suppliedTopic = answerMatch[2].trim();
    continue;
  }
  const explanationMatch = line.match(/^Explanation:\s*(.+)$/i);
  if (explanationMatch) current.explanation = explanationMatch[1].trim();
}
flush();

const classification = JSON.parse(await readFile(classificationPath, "utf8")) as { records?: Array<{ externalId: string; suggestedTopic: string | null }> };
const overrides = new Map((classification.records ?? []).filter((record) => record.suggestedTopic).map((record) => [record.externalId, record.suggestedTopic!]));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const modelPayload = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json", "utf8")) as { questions?: Array<{ id?: string; subject?: string; question?: string }> };
const authorised = await db.select({ subject: questionItems.subject, question: questionItems.questionText, id: questionItems.externalId })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));
const fingerprints = new Map<string, { bank: "model" | "authorised"; id: string }>();
for (const item of modelPayload.questions ?? []) if (item.subject && item.question && subjects.has(item.subject as Subject)) fingerprints.set(`${item.subject}:${normaliseStem(item.question)}`, { bank: "model", id: item.id ?? "model-question" });
for (const item of authorised) if (subjects.has(item.subject as Subject)) fingerprints.set(`${item.subject}:${normaliseStem(item.question)}`, { bank: "authorised", id: item.id });

const seen = new Set<string>();
const release: StagedRecord[] = [];
const duplicates: Array<{ externalId: string; bank: string; matchingId: string }> = [];
const holds: Array<{ externalId: string; subject: Subject; sourceNumber: number; reason: string }> = [];
for (const record of records) {
  const fingerprint = `${record.subject}:${normaliseStem(record.question)}`;
  if (seen.has(fingerprint)) {
    duplicates.push({ externalId: record.externalId, bank: "same PDF", matchingId: "earlier record" });
    continue;
  }
  seen.add(fingerprint);
  const existing = fingerprints.get(fingerprint);
  if (existing) {
    duplicates.push({ externalId: record.externalId, bank: existing.bank, matchingId: existing.id });
    continue;
  }
  const inferred = inferVerifiedTopic(record.subject as TopicSubject, record.question);
  const topic = overrides.get(record.externalId) ?? resolveSyllabusTopic(record.subject as SyllabusSubject, record.suppliedTopic) ?? (inferred ? resolveSyllabusTopic(record.subject as SyllabusSubject, inferred) : null);
  const optionKeys = record.options.map(normaliseOption);
  if (!topic) holds.push({ externalId: record.externalId, subject: record.subject, sourceNumber: record.sourceNumber, reason: "no safe official syllabus mapping" });
  else if (record.options.length < 4 || record.options.length > 5) holds.push({ externalId: record.externalId, subject: record.subject, sourceNumber: record.sourceNumber, reason: `expected four or five options, found ${record.options.length}` });
  else if (new Set(optionKeys).size !== optionKeys.length) holds.push({ externalId: record.externalId, subject: record.subject, sourceNumber: record.sourceNumber, reason: "duplicate option text" });
  else if (record.answerIndex < 0 || record.answerIndex >= record.options.length) holds.push({ externalId: record.externalId, subject: record.subject, sourceNumber: record.sourceNumber, reason: "answer key cannot be aligned to options" });
  else if (!record.explanation) holds.push({ externalId: record.externalId, subject: record.subject, sourceNumber: record.sourceNumber, reason: "missing supplied explanation" });
  else release.push({
    externalId: record.externalId,
    subject: record.subject,
    topic,
    difficulty: "hard",
    question: record.question,
    options: record.options,
    answerIndex: record.answerIndex,
    explanation: record.explanation,
    sourceLabel: `JAMB 500 Question Master Bank · ${record.subject} · August 2026`,
    permissionNote: "Owner-supplied keyed master-bank PDF for direct JAMB Quest use. The supplied answers and concise explanations are retained; full-bank duplicate prevention, card-shape integrity, and exact official syllabus mapping are applied before gameplay release.",
  });
}

const report = { parsedKeyedRecords: records.length, releaseReady: release.length, duplicates, holds, classification: { mapped: overrides.size, held: (classification.records ?? []).filter((record) => !record.suggestedTopic).length }, bySubject: Object.fromEntries([...subjects].map((item) => [item, release.filter((record) => record.subject === item).length])) };
await writeFile(stagePath, JSON.stringify(release, null, 2) + "\n");
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ parsedKeyedRecords: report.parsedKeyedRecords, releaseReady: report.releaseReady, duplicates: duplicates.length, holds: holds.length, classification: report.classification, bySubject: report.bySubject }, null, 2));
