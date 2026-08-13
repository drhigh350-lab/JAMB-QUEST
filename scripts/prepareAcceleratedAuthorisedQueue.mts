import { and, asc, eq } from "drizzle-orm";
import { readFile, writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";

const [limitRaw = "500", outputPath = "authorised-accelerated-500.input.json", ...priorOutputPaths] = process.argv.slice(2);
const limit = Number(limitRaw);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error("Limit must be an integer between 1 and 500");
const excludedIds = new Set<number>();
for (const path of priorOutputPaths) {
  const priorRecords = JSON.parse(await readFile(path, "utf8")) as Array<{ id?: string; needs_review?: boolean }>;
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
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review")))
  .orderBy(asc(questionItems.id))
  .limit(limit + excludedIds.size + 100);
const allowedSubjects = new Set(["Use of English", "Biology", "Chemistry", "Physics"]);
const payload = rows.filter((row) => allowedSubjects.has(row.subject) && !excludedIds.has(row.id)).slice(0, limit).map((row) => ({ id: `authorised-${row.id}`, subject: row.subject, topic: row.topic, question: row.question, options: JSON.parse(row.optionsJson), answer_index: row.answerIndex, explanation: row.explanation ?? "", sourceLabel: row.sourceLabel }));
if (payload.length !== limit) throw new Error(`Only ${payload.length} eligible questions were available; expected ${limit}`);
const subjects = Object.fromEntries([...new Set(payload.map((record) => record.subject))].map((subject) => [subject, payload.filter((record) => record.subject === subject).length]));
const sources = Object.fromEntries([...new Set(payload.map((record) => record.sourceLabel))].map((source) => [source, payload.filter((record) => record.sourceLabel === source).length]));
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ selected: payload.length, excludedPriorReviewRecords: excludedIds.size, outputPath, subjects, sources }, null, 2));
process.exit(0);
