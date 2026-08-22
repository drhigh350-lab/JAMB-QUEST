import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";

const INPUT_PATH = "/home/ubuntu/jamb-import-staging/owner_english_instruction_updates_20260822.json";
const RECEIPT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_english_instruction_update_receipt.json";
const updates = JSON.parse(await readFile(INPUT_PATH, "utf8")) as Array<{ id: number; questionText: string }>;
if (!updates.length) throw new Error("No instruction updates were staged.");
if (new Set(updates.map((update) => update.id)).size !== updates.length) throw new Error("Duplicate instruction-update IDs are not allowed.");
if (updates.some((update) => !update.questionText.startsWith("Choose the option"))) throw new Error("Each staged correction must begin with an explicit learner instruction.");

const db = await getDb();
if (!db) throw new Error("Database unavailable for instruction-only update.");
const existing = await db.select({ id: questionItems.id, externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, questionText: questionItems.questionText })
  .from(questionItems)
  .where(inArray(questionItems.id, updates.map((update) => update.id)));
if (existing.length !== updates.length) throw new Error(`Staged update count (${updates.length}) does not match source rows (${existing.length}).`);
if (existing.some((row) => row.subject !== "Use of English" || !row.externalId.startsWith("ENG-OWNER-"))) throw new Error("Instruction-only updates may target only owner-supplied Use of English records.");

const before = new Map(existing.map((row) => [row.id, row]));
for (const update of updates) {
  await db.update(questionItems).set({ questionText: update.questionText }).where(eq(questionItems.id, update.id));
}
const receipt = {
  updatedCount: updates.length,
  protectedFieldsUnchanged: ["externalId", "subject", "topic", "optionsJson", "answerIndex", "explanation"],
  updates: updates.map((update) => {
    const prior = before.get(update.id)!;
    return {
      id: update.id,
      externalId: prior.externalId,
      beforeQuestionHash: createHash("sha256").update(prior.questionText).digest("hex"),
      afterQuestionHash: createHash("sha256").update(update.questionText).digest("hex"),
    };
  }),
};
await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ updatedCount: receipt.updatedCount, protectedFieldsUnchanged: receipt.protectedFieldsUnchanged }, null, 2));
