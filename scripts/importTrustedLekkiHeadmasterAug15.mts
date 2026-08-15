import { readFile, writeFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, hasEmbeddedOptionMetadata, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const inputPath = "/home/ubuntu/jamb-import-staging/lekki-headmaster-120-keyed-staging.json";
const sourceLabel = "The Lekki Headmaster · Owner-confirmed curated question batch · August 2026";
const permissionNote = "Owner-confirmed curated Lekki Headmaster questions with supplied answer keys. Directly released on 15 August 2026 without requiring long explanations; automatic duplicate, four-option, and answer-index safeguards still apply.";
const normalise = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");

type IncomingRecord = {
  externalId: string;
  subject: "Use of English";
  topic: "The Lekki Headmaster";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerIndex: number;
};
type IncomingFile = { questions: IncomingRecord[] };

const raw = JSON.parse(await readFile(inputPath, "utf8")) as IncomingFile;
const incoming = raw.questions;
if (incoming.length !== 109) throw new Error(`Expected 109 keyed Lekki questions; found ${incoming.length}.`);
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");

const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
const activeQuestions = await db.select({ subject: questionItems.subject, question: questionItems.questionText })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.subject, "Use of English")));
const activeFingerprints = new Set(activeQuestions.map((record) => `${record.subject}:${normalise(record.question)}`));
const batchIds = new Set<string>();
const duplicateQuestions: string[] = [];
const structuralHolds: Array<{ externalId: string; reason: string }> = [];
const release: IncomingRecord[] = [];

for (const record of incoming) {
  const externalId = record.externalId.toLocaleLowerCase();
  if (batchIds.has(externalId)) {
    structuralHolds.push({ externalId: record.externalId, reason: "duplicate external ID in supplied batch" });
    continue;
  }
  batchIds.add(externalId);
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (activeFingerprints.has(fingerprint)) {
    duplicateQuestions.push(record.externalId);
    continue;
  }
  activeFingerprints.add(fingerprint);
  if (!record.question.trim()) structuralHolds.push({ externalId: record.externalId, reason: "missing question" });
  else if (!Array.isArray(record.options) || record.options.length !== 4 || record.options.some((option) => !option.trim() || hasEmbeddedOptionMetadata(option))) structuralHolds.push({ externalId: record.externalId, reason: "invalid or malformed options" });
  else if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex > 3) structuralHolds.push({ externalId: record.externalId, reason: "invalid answer index" });
  else release.push(record);
}

if (structuralHolds.length || duplicateQuestions.length) throw new Error(`Lekki direct release retained holds: ${JSON.stringify({ structuralHolds, duplicateQuestions })}`);
if (release.length !== 109) throw new Error(`Expected 109 direct-release questions; received ${release.length}.`);

let imported = 0;
let sourceId = existingSource?.id ?? null;
if (!sourceId) {
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote,
    fileName: "lekki-headmaster-120-owner-keyed-questions.json",
    storageKey: "owner-curated://lekki-headmaster-120-owner-keyed-questions.json",
    questions: release.map(({ externalId, subject, topic, difficulty, question, options, answerIndex }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  sourceId = result.sourceId;
  imported = result.questionCount;
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, sourceId));
}

const receipt = { sourceLabel, incomingRecords: incoming.length, released: release.length, imported, duplicateQuestions, structuralHolds, skippedExistingSource: Boolean(existingSource), sourceId, explanationPolicy: "No explanation required; learner answer feedback remains available through the keyed option." };
await writeFile("/home/ubuntu/jamb-import-staging/trusted_lekki_headmaster_aug15_import_receipt.json", `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
