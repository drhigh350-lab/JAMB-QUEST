import { eq, inArray } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_5_to_7_answer_matched_eligible.json";
const RECEIPT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_5_to_7_release_receipt.json";
const expected = new Map([
  ["Owner PDF answer-matched Biology 151–250 · 23 Aug 2026", 98],
  ["Owner PDF answer-matched Chemistry 1–100 · 23 Aug 2026", 94],
  ["Owner PDF answer-matched Chemistry 101–200 · 23 Aug 2026", 95],
]);
type Candidate = { externalId: string; subject: "Biology" | "Chemistry"; topic: string; difficulty: "medium"; question: string; options: string[]; answerIndex: number; explanation: string; sourceLabel: string; permissionNote: string };

const staged = JSON.parse(await readFile(STAGED_PATH, "utf8")) as Candidate[];
if (staged.length !== 287 || new Set(staged.map((record) => record.externalId)).size !== 287) throw new Error("Expected exactly the 287 records validated after documented source holds.");
if ([...expected.entries()].some(([label, count]) => staged.filter((record) => record.sourceLabel === label).length !== count)) throw new Error("Staged records do not match the expected exact source ranges.");
if (!ENV.ownerOpenId) throw new Error("Owner account configuration is unavailable.");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "JAMB Quest owner", role: "admin" });
const [owner, db] = await Promise.all([getUserByOpenId(ENV.ownerOpenId), getDb()]);
if (!owner || !db) throw new Error("Owner account or database is unavailable.");

const results: Array<{ sourceLabel: string; expectedCount: number; sourceId: number; importedCount: number; approvedCount: number }> = [];
for (const [sourceLabel, expectedCount] of expected) {
  const records = staged.filter((record) => record.sourceLabel === sourceLabel);
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote: records[0]!.permissionNote,
    fileName: "jamb_questions_only.pdf + owner answer/explanation Markdown",
    storageKey: `owner-pdf://jamb_questions_only/${records[0]!.subject.toLowerCase()}-${records[0]!.externalId.slice(-3)}-range`,
    questions: records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  const result = await importAuthorisedQuestionSet(owner.id, payload);
  if (result.questionCount !== expectedCount) throw new Error(`${sourceLabel}: importer returned ${result.questionCount}, expected ${expectedCount}.`);
  const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, explanationStatus: questionItems.explanationStatus })
    .from(questionItems)
    .where(eq(questionItems.sourceId, result.sourceId));
  if (rows.length !== expectedCount || rows.some((row) => row.explanationStatus !== "needs_review") || new Set(rows.map((row) => row.externalId)).size !== expectedCount) {
    throw new Error(`${sourceLabel}: imported rows do not have the expected protected pre-release state.`);
  }
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(inArray(questionItems.id, rows.map((row) => row.id)));
  const approvedRows = await db.select({ id: questionItems.id }).from(questionItems).where(eq(questionItems.sourceId, result.sourceId));
  if (approvedRows.length !== expectedCount) throw new Error(`${sourceLabel}: post-release count changed unexpectedly.`);
  results.push({ sourceLabel, expectedCount, sourceId: result.sourceId, importedCount: result.questionCount, approvedCount: approvedRows.length });
}
const approvedBySubject = (await db.select({ subject: questionItems.subject, explanationStatus: questionItems.explanationStatus }).from(questionItems))
  .filter((row) => row.explanationStatus === "approved")
  .reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.subject]: (counts[row.subject] ?? 0) + 1 }), {});
const receipt = {
  release: "Owner PDF answer-matched Biology 151–250 and Chemistry 1–200 · 23 Aug 2026",
  releasedCount: results.reduce((sum, result) => sum + result.approvedCount, 0),
  heldCount: 13,
  sourceGroups: results,
  updatedFields: ["explanationStatus"],
  preservedProtectedFields: ["externalId", "subject", "topic", "questionText", "optionsJson", "answerIndex", "explanation"],
  verifiedApprovedAuthorisedTotal: Object.values(approvedBySubject).reduce((sum, count) => sum + count, 0),
  approvedAuthorisedBySubject: approvedBySubject,
};
await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
