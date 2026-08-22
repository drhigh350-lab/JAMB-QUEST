import { writeFile } from "node:fs/promises";
import { and, eq, like } from "drizzle-orm";
import { questionItems } from "../drizzle/schema";
import { getDb } from "../server/db";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const OUTPUT_PATH = "/home/ubuntu/jamb-import-staging/owner_english_instruction_updates_20260822.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/owner_english_instruction_audit.json";
const db = await getDb();
if (!db) throw new Error("Database unavailable for owner English instruction audit.");

const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, topic: questionItems.topic, questionText: questionItems.questionText })
  .from(questionItems)
  .where(and(eq(questionItems.subject, "Use of English"), like(questionItems.externalId, "ENG-OWNER-%")));
const updates = rows.map((row) => ({ ...row, ...withUseOfEnglishInstruction(row.topic, row.questionText) })).filter((row) => row.changed);
const report = {
  ownerEnglishRecords: rows.length,
  recordsNeedingInstruction: updates.length,
  alreadyExplicit: rows.length - updates.length,
  updates: updates.map(({ id, externalId, topic, instruction }) => ({ id, externalId, topic, instruction })),
};
await writeFile(OUTPUT_PATH, `${JSON.stringify(updates.map(({ id, questionText }) => ({ id, questionText })), null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
