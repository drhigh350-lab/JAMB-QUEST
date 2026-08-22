import { readFile, writeFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_2_to_4_answer_matched_eligible.json";
const AUDIT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_2_to_4_answer_match_audit.json";
const RECEIPT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_batches_2_to_4_release_receipt.json";
const EXPECTED_GROUPS = new Map([
  ["Owner PDF answer-matched Use of English 101–200 · 22 Aug 2026", 100],
  ["Owner PDF answer-matched Use of English 201–250 · 22 Aug 2026", 50],
  ["Owner PDF answer-matched Biology 1–50 · 22 Aug 2026", 50],
  ["Owner PDF answer-matched Biology 51–150 · 22 Aug 2026", 100],
]);

const [stagedRaw, auditRaw] = await Promise.all([readFile(STAGED_PATH, "utf8"), readFile(AUDIT_PATH, "utf8")]);
const staged = JSON.parse(stagedRaw) as Array<{ externalId: string; subject: "Use of English" | "Biology"; sourceLabel: string }>;
const audit = JSON.parse(auditRaw) as { eligibleCount: number; heldCount: number };
const externalIds = staged.map((record) => record.externalId);
const stagedCountByLabel = new Map([...EXPECTED_GROUPS.keys()].map((label) => [label, staged.filter((record) => record.sourceLabel === label).length]));
if (
  staged.length !== 300 ||
  audit.eligibleCount !== 300 ||
  audit.heldCount !== 0 ||
  new Set(externalIds).size !== 300 ||
  staged.some((record) => !EXPECTED_GROUPS.has(record.sourceLabel)) ||
  [...EXPECTED_GROUPS.entries()].some(([label, count]) => stagedCountByLabel.get(label) !== count)
) {
  throw new Error("The staged release payload is not the expected audited 300-record PDF batches 2–4 set.");
}

const db = await getDb();
if (!db) throw new Error("Database unavailable for authorised release.");
const rows = await db
  .select({
    id: questionItems.id,
    externalId: questionItems.externalId,
    subject: questionItems.subject,
    sourceLabel: questionSources.label,
    explanationStatus: questionItems.explanationStatus,
    topic: questionItems.topic,
    questionText: questionItems.questionText,
    optionsJson: questionItems.optionsJson,
    answerIndex: questionItems.answerIndex,
    explanation: questionItems.explanation,
  })
  .from(questionItems)
  .innerJoin(questionSources, and(eq(questionItems.sourceId, questionSources.id), inArray(questionSources.label, [...EXPECTED_GROUPS.keys()])))
  .where(inArray(questionItems.externalId, externalIds));
if (
  rows.length !== staged.length ||
  rows.some((row) => row.explanationStatus !== "needs_review" || !EXPECTED_GROUPS.has(row.sourceLabel) || (row.subject !== "Use of English" && row.subject !== "Biology"))
) {
  throw new Error(`Release safeguard failed: expected ${staged.length} source-verified, unapproved records but found ${rows.length}.`);
}

await db.update(questionItems).set({ explanationStatus: "approved" }).where(inArray(questionItems.externalId, externalIds));
const releasedRows = await db.select({ subject: questionItems.subject, explanationStatus: questionItems.explanationStatus }).from(questionItems);
const approvedBySubject = releasedRows.filter((row) => row.explanationStatus === "approved").reduce<Record<string, number>>((counts, row) => {
  counts[row.subject] = (counts[row.subject] ?? 0) + 1;
  return counts;
}, {});
const receipt = {
  release: "Owner PDF answer-matched batches 2–4 · 22 Aug 2026",
  releasedCount: rows.length,
  sourceLabels: [...EXPECTED_GROUPS.keys()],
  releasedBySourceLabel: Object.fromEntries([...EXPECTED_GROUPS.entries()]),
  updatedFields: ["explanationStatus"],
  preservedProtectedFields: ["externalId", "subject", "topic", "questionText", "optionsJson", "answerIndex", "explanation"],
  sourceStatusBeforeRelease: [...new Set(rows.map((row) => row.explanationStatus))],
  approvedAuthorisedBySubject: approvedBySubject,
  verifiedApprovedAuthorisedTotal: Object.values(approvedBySubject).reduce((total, count) => total + count, 0),
};
await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
