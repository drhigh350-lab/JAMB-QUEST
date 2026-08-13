import { and, asc, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const [subject = "Biology", limitRaw = "25", outputPath = "authorised-biology-explanation-pilot.input.json", priorOutputPath] = process.argv.slice(2);
const limit = Number(limitRaw);
if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Limit must be an integer between 1 and 100");
const excludedIds = new Set<number>();
if (priorOutputPath) {
  const priorRecords = JSON.parse(await readFile(priorOutputPath, "utf8")) as Array<{ id?: string; needs_review?: boolean }>;
  for (const record of priorRecords) {
    if (!record.needs_review) continue;
    const id = Number(record.id?.replace(/^authorised-/, ""));
    if (Number.isInteger(id)) excludedIds.add(id);
  }
}
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic, question: questionItems.questionText, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, sourceLabel: questionSources.label })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review"), eq(questionItems.subject, subject)))
  .orderBy(asc(questionItems.id))
  .limit(limit + excludedIds.size + 100);
const payload = rows.filter((row) => !excludedIds.has(row.id)).slice(0, limit).map((row) => ({ id: `authorised-${row.id}`, subject: row.subject, topic: row.topic, question: row.question, options: JSON.parse(row.optionsJson), answer_index: row.answerIndex, explanation: row.explanation ?? "", sourceLabel: row.sourceLabel }));
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ subject, selected: payload.length, excludedPriorReviewRecords: excludedIds.size, outputPath, sourceLabels: [...new Set(payload.map((record) => record.sourceLabel))] }, null, 2));
process.exit(0);
