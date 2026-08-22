import { readFile, writeFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_uoe_001_to_100_answer_matched_eligible.json";
const AUDIT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_uoe_001_to_100_answer_match_audit.json";
const RECEIPT_PATH = "/home/ubuntu/jamb-quiz-game/reports/pdf_owner_uoe_001_to_100_release_receipt.json";
const SOURCE_LABEL = "Owner PDF answer-matched Use of English 1–100 · 22 Aug 2026";

const [stagedRaw, auditRaw] = await Promise.all([readFile(STAGED_PATH, "utf8"), readFile(AUDIT_PATH, "utf8")]);
const staged = JSON.parse(stagedRaw) as Array<{ externalId: string; subject: "Use of English"; sourceLabel: string }>;
const audit = JSON.parse(auditRaw) as { eligibleCount: number; held: Array<{ externalId: string }> };
const externalIds = staged.map((record) => record.externalId);

if (
  staged.length !== 99 ||
  audit.eligibleCount !== 99 ||
  new Set(externalIds).size !== 99 ||
  staged.some((record) => record.subject !== "Use of English" || record.sourceLabel !== SOURCE_LABEL || record.externalId === "PDF-OWNER-20260822-ENG-031") ||
  !audit.held.some((hold) => hold.externalId === "PDF-OWNER-20260822-ENG-031")
) {
  throw new Error("The staged release payload is not the expected audited 99-record Use of English batch with question 31 held.");
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
  .innerJoin(questionSources, and(eq(questionItems.sourceId, questionSources.id), eq(questionSources.label, SOURCE_LABEL)))
  .where(inArray(questionItems.externalId, externalIds));

if (
  rows.length !== staged.length ||
  rows.some((row) => row.subject !== "Use of English" || row.sourceLabel !== SOURCE_LABEL || row.explanationStatus !== "needs_review")
) {
  throw new Error(`Release safeguard failed: expected ${staged.length} source-verified, unapproved Use of English rows but found ${rows.length}.`);
}

await db.update(questionItems).set({ explanationStatus: "approved" }).where(inArray(questionItems.externalId, externalIds));
const releasedRows = await db.select({ subject: questionItems.subject, explanationStatus: questionItems.explanationStatus }).from(questionItems);
const approvedBySubject = releasedRows
  .filter((row) => row.explanationStatus === "approved")
  .reduce<Record<string, number>>((counts, row) => {
    counts[row.subject] = (counts[row.subject] ?? 0) + 1;
    return counts;
  }, {});
const receipt = {
  release: SOURCE_LABEL,
  releasedCount: rows.length,
  heldExternalId: "PDF-OWNER-20260822-ENG-031",
  sourceLabel: SOURCE_LABEL,
  updatedFields: ["explanationStatus"],
  preservedProtectedFields: ["externalId", "subject", "topic", "questionText", "optionsJson", "answerIndex", "explanation"],
  sourceStatusBeforeRelease: [...new Set(rows.map((row) => row.explanationStatus))],
  approvedAuthorisedBySubject: approvedBySubject,
  verifiedApprovedAuthorisedTotal: Object.values(approvedBySubject).reduce((total, count) => total + count, 0),
};
await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(0);
