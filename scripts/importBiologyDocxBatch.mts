import { eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const batch = Number(process.argv[2] ?? 1);
const stagedPath = `/home/ubuntu/jamb-quiz-game/reports/biology_explanation_batch_${String(batch).padStart(3, "0")}_staged.json`;
const sourceLabel = `Owner Biology DOCX · Uniform explanation batch ${String(batch).padStart(3, "0")}`;
const permissionNote = "Owner-provided Biology past-question DOCX supplied for JAMB Quest processing; wording and answer keys preserved, explanations formatted for uniform learner clarity, and only validated records released.";
const incoming = JSON.parse(await readFile(stagedPath, "utf8")) as Array<{ externalId: string; subject: "Biology"; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation?: string }>;
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable.");
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const existing = await db.select({ subject: questionItems.subject, question: questionItems.questionText }).from(questionItems).where(eq(questionItems.subject, "Biology"));
const seen = new Set(existing.map((row) => `${row.subject}:${normalise(row.question)}`));
const duplicates: string[] = [];
const structuralHolds: Array<{ externalId: string; reason: string }> = [];
const release = [] as typeof incoming;
for (const record of incoming) {
  const fingerprint = `${record.subject}:${normalise(record.question)}`;
  if (seen.has(fingerprint)) { duplicates.push(record.externalId); continue; }
  seen.add(fingerprint);
  const lines = (record.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!record.question.trim()) structuralHolds.push({ externalId: record.externalId, reason: "missing question" });
  else if (!Array.isArray(record.options) || (record.options.length !== 4 && record.options.length !== 5) || record.options.some((option) => !option.trim())) structuralHolds.push({ externalId: record.externalId, reason: "invalid option structure" });
  else if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex >= record.options.length) structuralHolds.push({ externalId: record.externalId, reason: "invalid answer index" });
  else if (lines.length < 4 || lines.length > 5) structuralHolds.push({ externalId: record.externalId, reason: `explanation lines: ${lines.length}` });
  else release.push(record);
}
if (structuralHolds.length) throw new Error(`Biology batch retained structural holds: ${JSON.stringify(structuralHolds)}`);
if (!release.length) throw new Error("No new Biology records remain after duplicate protection.");
const payload = authorisedImportSchema.parse({ sourceLabel, permissionNote, fileName: `JAMBBIOLOGYPASTQUESTION_DR_HIGH_batch_${batch}.docx`, storageKey: `owner-docx://biology-dr-high/batch-${batch}`, questions: release });
const result = await importAuthorisedQuestionSet(owner.id, payload);
await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
const receipt = { sourceLabel, incoming: incoming.length, duplicates, structuralHolds, released: release.length, sourceId: result.sourceId, questionCount: result.questionCount };
await writeFile(`reports/biology_docx_batch_${String(batch).padStart(3, "0")}_import_receipt.json`, JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
