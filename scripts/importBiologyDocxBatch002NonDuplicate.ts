import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

type Staged = { externalId: string; subject: "Biology"; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };
type Generated = { sourceId: string; lines: string[]; status: string };

const stagedPath = "reports/biology_explanation_batch_002_staged.json";
const generatedPath = "reports/biology_explanation_batch_002.json";
const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const receiptPath = "reports/biology_explanation_batch_002_non_duplicate_import_receipt.json";
const intendedIds = new Set(["biology-dr-high-0047", "biology-dr-high-0059", "biology-dr-high-0060", "biology-dr-high-0062"]);

function normalise(value: string) {
  return value.toLocaleLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

const staged = JSON.parse(await readFile(stagedPath, "utf8")) as Staged[];
const generatedPayload = JSON.parse(await readFile(generatedPath, "utf8")) as { records: Generated[] };
const generated = new Map(generatedPayload.records.map((record) => [record.sourceId, record]));
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const existing = await db.select({ subject: questionItems.subject, question: questionItems.questionText, externalId: questionItems.externalId })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const modelPayload = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: Array<{ subject?: string; question?: string; id?: string }> };
const fingerprints = new Set<string>();
for (const record of existing) fingerprints.add(`${record.subject}:${normalise(record.question)}`);
for (const record of modelPayload.questions ?? []) if (record.subject && record.question) fingerprints.add(`${record.subject}:${normalise(record.question)}`);

const holds: Array<{ externalId: string; reason: string }> = [];
const release = staged.filter((record) => intendedIds.has(record.externalId)).flatMap((record) => {
  const output = generated.get(record.externalId);
  const topic = resolveSyllabusTopic("Biology", record.topic);
  const fingerprint = `Biology:${normalise(record.question)}`;
  const explanation = output?.lines?.join("\n") ?? "";
  if (!topic) {
    holds.push({ externalId: record.externalId, reason: "no official syllabus topic" });
    return [];
  }
  if (fingerprints.has(fingerprint)) {
    holds.push({ externalId: record.externalId, reason: "duplicate in active bank" });
    return [];
  }
  if (!output || output.status !== "ready" || output.lines.length !== 4 || output.lines.some((line) => !line.trim())) {
    holds.push({ externalId: record.externalId, reason: "four-line explanation gate failed" });
    return [];
  }
  if (record.options.length !== 4 || new Set(record.options.map(normalise)).size !== 4 || record.answerIndex < 0 || record.answerIndex >= 4) {
    holds.push({ externalId: record.externalId, reason: "option or answer-index gate failed" });
    return [];
  }
  return [{ ...record, topic, explanation }];
});

if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account unavailable");
let imported = 0;
let sourceId: number | null = null;
if (release.length) {
  const sourceLabel = release[0].sourceLabel;
  const [source] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, sourceLabel)).limit(1);
  if (source) {
    holds.push(...release.map((record) => ({ externalId: record.externalId, reason: "source label already exists; no rerun import" })));
  } else {
    const payload = authorisedImportSchema.parse({
      sourceLabel,
      permissionNote: release[0].permissionNote,
      fileName: "biology_docx_batch_002.json",
      storageKey: "owner-docx://biology_docx_batch_002.json",
      questions: release.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
    });
    const result = await importAuthorisedQuestionSet(owner.id, payload);
    await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
    imported = result.questionCount;
    sourceId = result.sourceId;
  }
}
const report = { intended: intendedIds.size, releaseReady: release.length, imported, sourceId, holds };
await writeFile(receiptPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
