import { readFile, writeFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, hasEmbeddedOptionMetadata, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";
import { questionItems, questionSources } from "../drizzle/schema";

const inputPath = "/home/ubuntu/jamb-import-staging/lekki_owner_chapters_aug15/lekki_owner_chapter_questions.json";
const sourceLabel = "The Lekki Headmaster · Owner chapter-by-chapter batch · August 2026";
const retiringSourceMarker = "The Lekki Headmaster";
const permissionNote = "Owner-supplied chapter-by-chapter Lekki Headmaster questions with 13 complete answer keys. Direct release preserves supplied wording, chapter topics, and keys without inventing explanations; duplicate, four-option, and answer-index safeguards apply.";
const expectedCount = 650;
const normalise = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
const fingerprintQuestion = (subject: string, question: string, options: string[]) => `${subject}:${normalise(question)}:${options.map(normalise).join("|")}`;

type IncomingRecord = {
  externalId: string;
  subject: "Use of English";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerIndex: number;
};
type IncomingFile = { sourceLabel: string; questions: IncomingRecord[] };

const raw = JSON.parse(await readFile(inputPath, "utf8")) as IncomingFile;
if (raw.questions.length !== expectedCount) throw new Error(`Expected ${expectedCount} chapter-keyed Lekki questions; found ${raw.questions.length}.`);
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");

await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");

const activeQuestions = await db.select({ subject: questionItems.subject, question: questionItems.questionText, optionsJson: questionItems.optionsJson, sourceLabel: questionSources.label })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.subject, "Use of English")));
const activeFingerprints = new Set(activeQuestions
  .filter((record) => !record.sourceLabel.includes(retiringSourceMarker))
  .map((record) => fingerprintQuestion(record.subject, record.question, JSON.parse(record.optionsJson) as string[])));
const fingerprintSources = new Map<string, string[]>();
for (const record of activeQuestions) {
  const fingerprint = fingerprintQuestion(record.subject, record.question, JSON.parse(record.optionsJson) as string[]);
  fingerprintSources.set(fingerprint, [...(fingerprintSources.get(fingerprint) ?? []), record.sourceLabel]);
}

const batchIds = new Set<string>();
const duplicateQuestions: Array<{ externalId: string; sourceLabels: string[] }> = [];
const structuralHolds: Array<{ externalId: string; reason: string }> = [];
const release: IncomingRecord[] = [];
for (const record of raw.questions) {
  const externalId = record.externalId.toLocaleLowerCase();
  if (batchIds.has(externalId)) {
    structuralHolds.push({ externalId: record.externalId, reason: "duplicate external ID in supplied batch" });
    continue;
  }
  batchIds.add(externalId);
  const fingerprint = fingerprintQuestion(record.subject, record.question, record.options);
  if (activeFingerprints.has(fingerprint)) {
    duplicateQuestions.push({ externalId: record.externalId, sourceLabels: fingerprintSources.get(fingerprint) ?? [] });
    continue;
  }
  activeFingerprints.add(fingerprint);
  if (!record.question.trim()) structuralHolds.push({ externalId: record.externalId, reason: "missing question" });
  else if (!Array.isArray(record.options) || record.options.length !== 4 || record.options.some((option) => !option.trim() || hasEmbeddedOptionMetadata(option))) structuralHolds.push({ externalId: record.externalId, reason: "invalid or malformed options" });
  else if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex > 3) structuralHolds.push({ externalId: record.externalId, reason: "invalid answer index" });
  else release.push(record);
}
if (structuralHolds.length || duplicateQuestions.length) throw new Error(`Lekki chapter replacement retained holds: ${JSON.stringify({ structuralHolds, duplicateQuestions })}`);
if (release.length !== expectedCount) throw new Error(`Expected ${expectedCount} direct-release questions; received ${release.length}.`);

const importParts = [
  { label: `${sourceLabel} · Chapters 1–10`, fileName: "lekki-headmaster-owner-chapters-1-to-10.json", questions: release.slice(0, 500) },
  { label: `${sourceLabel} · Chapters 11–13`, fileName: "lekki-headmaster-owner-chapters-11-to-13.json", questions: release.slice(500) },
];
let imported = 0;
const sourceIds: number[] = [];
const importReceipts: Array<{ label: string; sourceId: number; imported: number; skippedExistingSource: boolean }> = [];
for (const part of importParts) {
  const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, part.label)).limit(1);
  let sourceId = existingSource?.id ?? null;
  let partImported = 0;
  if (!sourceId) {
    const payload = authorisedImportSchema.parse({
      sourceLabel: part.label,
      permissionNote,
      fileName: part.fileName,
      storageKey: `owner-curated://${part.fileName}`,
      questions: part.questions,
    });
    const result = await importAuthorisedQuestionSet(owner.id, payload);
    sourceId = result.sourceId;
    partImported = result.questionCount;
    imported += partImported;
    await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, sourceId));
  }
  if (!sourceId) throw new Error(`Unable to resolve Lekki chapter replacement source for ${part.label}.`);
  sourceIds.push(sourceId);
  importReceipts.push({ label: part.label, sourceId, imported: partImported, skippedExistingSource: Boolean(existingSource) });
}

const receipt = {
  sourceLabel,
  incomingRecords: raw.questions.length,
  released: release.length,
  imported,
  duplicateQuestions,
  structuralHolds,
  importReceipts,
  sourceIds,
  explanationPolicy: "No explanation required; learner answer feedback remains available through the owner-supplied keyed option.",
};
await writeFile("/home/ubuntu/jamb-import-staging/lekki_owner_chapter_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
