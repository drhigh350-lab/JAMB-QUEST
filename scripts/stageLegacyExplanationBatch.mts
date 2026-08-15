import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { writeFile } from "node:fs/promises";

const batchNumber = Number(process.argv[2] ?? "1");
const batchSize = 20;
if (!Number.isInteger(batchNumber) || batchNumber < 1) throw new Error("Batch number must be a positive integer");

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({
  id: questionItems.id,
  subject: questionItems.subject,
  topic: questionItems.topic,
  question: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  explanation: questionItems.explanation,
  sourceLabel: questionSources.label,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));

const candidates = rows.filter((row) => (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length > 5)
  .sort((left, right) => left.sourceLabel.localeCompare(right.sourceLabel) || left.id - right.id);
const selection = candidates.slice((batchNumber - 1) * batchSize, batchNumber * batchSize).map((row) => ({
  id: row.id,
  subject: row.subject,
  topic: row.topic,
  question: row.question,
  options: JSON.parse(row.optionsJson),
  answerIndex: row.answerIndex,
  answerText: JSON.parse(row.optionsJson)[row.answerIndex],
  originalExplanation: row.explanation,
  sourceLabel: row.sourceLabel,
}));
const report = { batchNumber, batchSize, availableCandidates: candidates.length, stagedCount: selection.length, records: selection };
await writeFile(`reports/legacy_explanation_batch_${String(batchNumber).padStart(3, "0")}_input.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ batchNumber, availableCandidates: candidates.length, stagedCount: selection.length, firstId: selection[0]?.id ?? null }, null, 2));
