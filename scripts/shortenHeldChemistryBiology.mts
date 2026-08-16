import { and, eq, inArray } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
import { getDb } from "../server/db";

const subject = (process.argv[2] ?? "Chemistry") as "Biology" | "Chemistry";
const batch = Number(process.argv[3] ?? 1);
const batchSize = Number(process.argv[4] ?? 20);
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, explanationStatus: questionItems.explanationStatus, sourceLabel: questionSources.label })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.subject, subject)));
const safe = rows.filter((row) => {
  const lines = (row.explanation ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  let options: unknown[] = [];
  try { options = JSON.parse(row.optionsJson); } catch {}
  const mapped = Boolean(resolveSyllabusTopic(subject, row.topic));
  const structural = options.length >= 4 && options.length <= 5 && options.every((x) => typeof x === "string" && x.trim()) && Number.isInteger(row.answerIndex) && row.answerIndex >= 0 && row.answerIndex < options.length;
  return lines.length > 5 && mapped && structural;
}).sort((a, b) => a.id - b.id);
const selected = safe.slice((batch - 1) * batchSize, batch * batchSize).map((row) => {
  const lines = (row.explanation ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const shortened = [...lines.slice(0, 3), lines.at(-1)!].filter((line, index, all) => all.indexOf(line) === index).join("\n");
  return { id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, sourceLabel: row.sourceLabel, beforeLines: lines.length, afterLines: shortened.split(/\r?\n/).length, before: row.explanation, after: shortened };
});
const out = `reports/${subject.toLowerCase()}_held_shortening_batch_${String(batch).padStart(3, "0")}.json`;
await writeFile(out, JSON.stringify({ subject, batch, batchSize, eligibleTotal: safe.length, selected }, null, 2) + "\n");
console.log(JSON.stringify({ subject, batch, eligibleTotal: safe.length, selected: selected.length, output: out, ids: selected.map((x) => x.id) }));
