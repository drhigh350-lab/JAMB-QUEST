import { and, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

type Staged = {
  externalId: string;
  subject: "Use of English" | "Biology" | "Chemistry" | "Physics";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
};
const stagedPath = "/home/ubuntu/jamb-import-staging/final_csv_aug16_staged.json";
const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const receiptPath = "/home/ubuntu/jamb-quiz-game/reports/final_csv_import_receipt_aug16.json";
const baseLabel = "Kairo · user-supplied final CSV · August 2026";
const chunkSize = 500;
function normalise(value: string) { return value.toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, " ").trim(); }
function chunks<T>(items: T[], size: number) { return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size)); }

const staged = JSON.parse(await readFile(stagedPath, "utf8")) as Staged[];
const model = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: Array<{ subject?: string; question?: string }> };
const db = await getDb();
if (!db || !ENV.ownerOpenId) throw new Error("Database or owner configuration unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account unavailable");

const existingRows = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1)));
const fingerprints = new Set<string>(existingRows.map((row) => `${row.subject}:${normalise(row.question)}`));
for (const row of model.questions ?? []) if (row.subject && row.question) fingerprints.add(`${row.subject}:${normalise(row.question)}`);

const release: Staged[] = [];
const holds: Array<{ externalId: string; reason: string }> = [];
for (const row of staged) {
  const key = `${row.subject}:${normalise(row.question)}`;
  if (fingerprints.has(key)) holds.push({ externalId: row.externalId, reason: "duplicate found during immediate pre-import recheck" });
  else { fingerprints.add(key); release.push(row); }
}
const receipt: { staged: number; releaseAfterRecheck: number; imported: number; chunks: Array<{ label: string; sourceId?: number; imported: number; skipped?: string }>; holds: typeof holds } = { staged: staged.length, releaseAfterRecheck: release.length, imported: 0, chunks: [], holds };
for (const [index, batch] of chunks(release, chunkSize).entries()) {
  const label = `${baseLabel} · Batch ${index + 1} of ${Math.ceil(release.length / chunkSize)}`;
  const [existingSource] = await db.select({ id: questionSources.id }).from(questionSources).where(eq(questionSources.label, label)).limit(1);
  if (existingSource) { receipt.chunks.push({ label, imported: 0, skipped: "source label already exists; no rerun import" }); continue; }
  const payload = authorisedImportSchema.parse({
    sourceLabel: label,
    permissionNote: batch[0].permissionNote,
    fileName: "questions_rows(2).csv",
    storageKey: `owner-csv://questions_rows(2)-batch-${index + 1}.csv`,
    questions: batch.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
  receipt.imported += result.questionCount;
  receipt.chunks.push({ label, sourceId: result.sourceId, imported: result.questionCount });
}
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ staged: receipt.staged, releaseAfterRecheck: receipt.releaseAfterRecheck, imported: receipt.imported, chunks: receipt.chunks, holdCount: receipt.holds.length }, null, 2));
