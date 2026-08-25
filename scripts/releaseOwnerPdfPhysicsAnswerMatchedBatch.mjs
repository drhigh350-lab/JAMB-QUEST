import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb, getUserByOpenId, importAuthorisedQuestionSet, upsertUser } from "../server/db";
import { authorisedImportSchema } from "../server/questionImport";

const sourceLabel = "Owner PDF answer-matched Physics 1–250 · 25 Aug 2026";
const stagePath = resolve("reports", "owner_pdf_physics_1_250_staged_20260825.json");
const receiptPath = resolve("reports", "owner_pdf_physics_1_250_import_receipt_20260825.json");

const stage = JSON.parse(await readFile(stagePath, "utf8"));
const records = Array.isArray(stage.staged) ? stage.staged : [];
if (records.length !== 206) throw new Error(`Expected exactly 206 release-ready Physics records; found ${records.length}`);
if (records.some((record) => record.subject !== "Physics" || record.duplicateOf || record.modelDuplicateOf || !record.topic || record.answerIndex < 0 || record.answerIndex >= record.options.length)) {
  throw new Error("Staged records failed the protected release contract");
}
const ids = records.map((record) => record.externalId);
if (new Set(ids).size !== ids.length) throw new Error("Release contains duplicate external IDs");

const db = await getDb();
if (!db) throw new Error("Database unavailable for protected release");
await upsertUser({ openId: ENV.ownerOpenId, name: ENV.ownerName ?? "Owner", role: "admin" });
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account unavailable for protected release");

const [existingSource] = await db.select({ id: questionSources.id })
  .from(questionSources)
  .where(eq(questionSources.label, sourceLabel))
  .limit(1);

let receipt;
if (existingSource) {
  receipt = {
    sourceLabel,
    status: "existing",
    sourceId: existingSource.id,
    imported: 0,
    staged: records.length,
    held: stage.holds?.length ?? 0,
    preservedProtectedFields: ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "externalId"],
  };
} else {
  const collisions = await db.select({ externalId: questionItems.externalId })
    .from(questionItems)
    .where(inArray(questionItems.externalId, ids));
  if (collisions.length) throw new Error(`Existing external-ID collision blocks import: ${collisions.map((row) => row.externalId).join(", ")}`);

  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote: "Owner-supplied jamb_questions_only.pdf plus matching Batch 8–10 Physics answer/explanation Markdown. Release excludes exact active-bank duplicates, wrapper variants, and the documented source/key conflict at Physics 77. Mathematics is not included.",
    fileName: "jamb_questions_only.pdf + Batch8/9/10 Physics answer/explanation Markdown",
    storageKey: "owner-pdf://jamb_questions_only.pdf#physics-1-250;owner-markdown://Batch8_Chem201-250_Phys1-50.md,Physics_Batch9_Q51-150.md,Physics_Batch10_Q151-250_FINAL.md",
    questions: records.map((record) => ({
      externalId: record.externalId,
      subject: "Physics",
      topic: record.topic,
      question: record.question,
      options: record.options,
      answerIndex: record.answerIndex,
      explanation: record.explanation,
    })),
  });

  const result = await importAuthorisedQuestionSet(owner.id, payload);
  await db.update(questionItems).set({ explanationStatus: "approved" }).where(eq(questionItems.sourceId, result.sourceId));
  receipt = {
    ...result,
    staged: records.length,
    held: stage.holds?.length ?? 0,
    heldByReason: stage.totals?.holdsByReason ?? {},
    preservedProtectedFields: ["questionText", "optionsJson", "answerIndex", "topic", "explanation", "externalId"],
  };
}

await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ receiptPath, ...receipt }, null, 2));
process.exit(0);
