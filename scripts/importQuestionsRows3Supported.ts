import { readFile, writeFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";

type Candidate = { id: string; subject: "Use of English" | "Biology" | "Chemistry" | "Physics"; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; answerIndex: number; explanation: string };
const payloadPath = "reports/questions_rows3_clean_supported_payload.json";
const receiptPath = "reports/questions_rows3_supported_import_receipt.json";
const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
const db = await getDb();
if (!owner || !db) throw new Error("Owner account or database is unavailable");
const source = JSON.parse(await readFile(payloadPath, "utf8")) as { records: Candidate[]; report: unknown };
const existing = await db.select({ externalId: questionItems.externalId, questionText: questionItems.questionText }).from(questionItems);
const existingIds = new Set(existing.map((row) => row.externalId?.toLowerCase()).filter(Boolean) as string[]);
const existingQuestions = new Set(existing.map((row) => normalize(row.questionText)));
const held: Array<{ id: string; reason: string }> = [];
const release: Candidate[] = [];
for (const record of source.records) {
  if (existingIds.has(record.id.toLowerCase())) { held.push({ id: record.id, reason: "existing_external_id" }); continue; }
  if (existingQuestions.has(normalize(record.question))) { held.push({ id: record.id, reason: "existing_question_stem" }); continue; }
  if (!resolveSyllabusTopic(record.subject, record.topic)) { held.push({ id: record.id, reason: "topic_not_mapped_to_syllabus" }); continue; }
  release.push(record);
}
const batches = chunk(release, 500);
const imported: Array<{ batch: number; staged: number; imported: number; sourceId: number; importId: number }> = [];
for (let index = 0; index < batches.length; index += 1) {
  const records = batches[index];
  const label = `Owner CSV questions_rows(3) · Clean supported release · Batch ${String(index + 1).padStart(2, "0")}`;
  const input = authorisedImportSchema.parse({
    sourceLabel: label,
    permissionNote: "Owner-provided questions_rows(3).csv. Only clean, duplicate-safe, supported-subject records with readable learner text and verified four-option answer keys are released. Mathematics and all quality-held records are excluded.",
    fileName: "questions_rows(3).csv",
    storageKey: "owner-csv://questions_rows(3).csv",
    questions: records.map(({ id, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId: id, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, input);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
  imported.push({ batch: index + 1, staged: records.length, imported: result.questionCount, sourceId: result.sourceId, importId: result.importId });
}
const receipt = { source: payloadPath, prepared: source.records.length, releaseReadyBeforeDbDedup: source.records.length, imported: imported.reduce((sum, item) => sum + item.imported, 0), held: held.length, heldByReason: held.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.reason]: (acc[item.reason] ?? 0) + 1 }), {}), batches: imported, heldExamples: held.slice(0, 100), status: "imported" as const };
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
