import { readFile, writeFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { questionItems, questionSources } from "../drizzle/schema";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

type KairoRow = {
  id: number;
  subject: "BIO" | "CHEM" | "PHY" | "ENG";
  question: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  correct_answer: string;
  explanation?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  topic?: string | null;
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

const inputPath = "/home/ubuntu/jamb-import-staging/kairo_questions_aug16.json";
const stagePath = "/home/ubuntu/jamb-import-staging/kairo_questions_aug16_staged.json";
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/kairo_stage_audit_aug16.json";
const sourceLabel = "Kairo · connected Supabase question table · August 2026";
const permissionNote = "User-authorized Kairo question table supplied through the connected Supabase workspace. Full-bank duplicate prevention, official JAMB syllabus resolution, option integrity, answer-index validation, and explanation-presence gates applied before gameplay release.";
const subjectMap: Record<KairoRow["subject"], SyllabusSubject> = { BIO: "Biology", CHEM: "Chemistry", PHY: "Physics", ENG: "Use of English" };

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
function normalizeStem(value: string) {
  return clean(value).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim();
}
function difficulty(value: string | null | undefined): Staged["difficulty"] {
  const v = clean(value).toLowerCase();
  return v === "easy" || v === "hard" ? v : "medium";
}

const payload = JSON.parse(await readFile(inputPath, "utf8")) as { records: KairoRow[] };
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const model = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: Array<{ id?: string; subject?: string; question?: string }> };
const authorised = await db
  .select({ subject: questionItems.subject, question: questionItems.questionText, id: questionItems.externalId })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));
const fingerprints = new Map<string, { bank: string; id: string }>();
for (const row of model.questions ?? []) {
  if (row.subject && row.question) fingerprints.set(`${row.subject}:${normalizeStem(row.question)}`, { bank: "model", id: row.id ?? "model" });
}
for (const row of authorised) {
  if (row.subject && row.question) fingerprints.set(`${row.subject}:${normalizeStem(row.question)}`, { bank: "authorised", id: row.id });
}
const seen = new Set<string>();
const staged: Staged[] = [];
const duplicates: Array<{ id: number; bank: string; matchingId: string }> = [];
const holds: Array<{ id: number; subject: string; reason: string }> = [];
for (const row of payload.records) {
  const subject = subjectMap[row.subject];
  const externalId = `kairo-supabase-${row.id}`;
  const question = clean(row.question);
  const options = [row.option_a, row.option_b, row.option_c, row.option_d, row.option_e].map(clean).filter(Boolean);
  const answer = clean(row.correct_answer).toUpperCase();
  const answerIndex = answer.length === 1 ? answer.charCodeAt(0) - 65 : -1;
  const fingerprint = `${subject}:${normalizeStem(question)}`;
  if (seen.has(fingerprint)) { duplicates.push({ id: row.id, bank: "same Kairo intake", matchingId: "earlier Kairo row" }); continue; }
  seen.add(fingerprint);
  const existing = fingerprints.get(fingerprint);
  if (existing) { duplicates.push({ id: row.id, bank: existing.bank, matchingId: existing.id }); continue; }
  const topic = resolveSyllabusTopic(subject, `${clean(row.topic)} ${clean(row.tags?.join(" "))}`);
  if (!question) holds.push({ id: row.id, subject: row.subject, reason: "missing question text" });
  else if (options.length < 4 || options.length > 5) holds.push({ id: row.id, subject: row.subject, reason: "question does not have four or five options" });
  else if (new Set(options.map(normalizeStem)).size !== options.length) holds.push({ id: row.id, subject: row.subject, reason: "duplicate option text" });
  else if (answerIndex < 0 || answerIndex >= options.length) holds.push({ id: row.id, subject: row.subject, reason: "answer key cannot be aligned to options" });
  else if (!clean(row.explanation)) holds.push({ id: row.id, subject: row.subject, reason: "missing explanation" });
  else if (!topic) holds.push({ id: row.id, subject: row.subject, reason: "blank or non-official topic label; no safe syllabus resolution" });
  else staged.push({ externalId, subject, topic, difficulty: difficulty(row.difficulty), question, options, answerIndex, explanation: clean(row.explanation), sourceLabel, permissionNote });
}
const report = { parsedRecords: payload.records.length, releaseReady: staged.length, duplicateRows: duplicates.length, heldRows: holds.length, bySubject: Object.fromEntries(Object.keys(subjectMap).map((code) => [subjectMap[code as KairoRow["subject"]], staged.filter((item) => item.subject === subjectMap[code as KairoRow["subject"]]).length])), holdReasons: Object.fromEntries([...new Set(holds.map((item) => item.reason))].map((reason) => [reason, holds.filter((item) => item.reason === reason).length])) };
await writeFile(stagePath, `${JSON.stringify(staged, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify({ ...report, duplicates, holds }, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
