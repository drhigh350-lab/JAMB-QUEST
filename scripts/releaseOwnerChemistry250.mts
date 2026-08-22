import { readFile, writeFile } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/owner_chemistry_1_250_stage.json";
const RECEIPT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_chemistry_1_250_release_receipt.json";
const SOURCE_LABEL = "Owner-supplied Chemistry 1–250 batch · 22 Aug 2026";

const staged = JSON.parse(await readFile(STAGED_PATH, "utf8")) as Array<{ externalId: string; subject: "Chemistry"; sourceLabel: string }>;
const externalIds = staged.map((record) => record.externalId);
if (staged.length !== 248 || new Set(externalIds).size !== staged.length || staged.some((record) => record.sourceLabel !== SOURCE_LABEL || record.subject !== "Chemistry")) {
  throw new Error("The staged release payload is not the expected unique 248-record Chemistry batch.");
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

if (rows.length !== staged.length || rows.some((row) => row.subject !== "Chemistry" || row.sourceLabel !== SOURCE_LABEL)) {
  throw new Error(`Release safeguard failed: expected ${staged.length} source-verified Chemistry rows but found ${rows.length}.`);
}

await db.update(questionItems).set({ explanationStatus: "approved" }).where(inArray(questionItems.externalId, externalIds));

const receipt = {
  release: "Owner-supplied Chemistry 1–250 batch · 22 Aug 2026",
  releasedCount: rows.length,
  sourceLabel: SOURCE_LABEL,
  updatedFields: ["explanationStatus"],
  preservedProtectedFields: ["externalId", "subject", "topic", "questionText", "optionsJson", "answerIndex", "explanation"],
  sourceStatusBeforeRelease: [...new Set(rows.map((row) => row.explanationStatus))],
};
await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
