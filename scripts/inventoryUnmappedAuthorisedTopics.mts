import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, hasEmbeddedOptionMetadata } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const db = await getDb();
if (!db) throw new Error("Database unavailable");

const rows = await db
  .select({
    id: questionItems.id,
    externalId: questionItems.externalId,
    subject: questionItems.subject,
    topic: questionItems.topic,
    difficulty: questionItems.difficulty,
    questionText: questionItems.questionText,
    optionsJson: questionItems.optionsJson,
    answerIndex: questionItems.answerIndex,
    explanation: questionItems.explanation,
    explanationStatus: questionItems.explanationStatus,
    sourceLabel: questionSources.label,
  })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));

function structuralStatus(row: (typeof rows)[number]) {
  if (row.explanationStatus !== "approved") return `status:${row.explanationStatus}`;
  try {
    const options = JSON.parse(row.optionsJson);
    if (!Array.isArray(options) || options.length < 4 || options.length > 5) return "invalid option count";
    if (options.some((option) => typeof option !== "string" || !option.trim() || hasEmbeddedOptionMetadata(option))) return "invalid option content";
    if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex >= options.length) return "answer index out of range";
    const lines = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 5) return "explanation exceeds five lines";
  } catch {
    return "unreadable option JSON";
  }
  return null;
}

const records = rows
  .filter((row) => !resolveSyllabusTopic(row.subject as SyllabusSubject, row.topic))
  .map((row) => ({
    id: row.id,
    externalId: row.externalId,
    subject: row.subject,
    currentTopic: row.topic,
    difficulty: row.difficulty,
    question: row.questionText,
    options: JSON.parse(row.optionsJson),
    answerIndex: row.answerIndex,
    explanation: row.explanation,
    explanationStatus: row.explanationStatus,
    sourceLabel: row.sourceLabel,
    otherReleaseBlocker: structuralStatus(row),
  }));

const bySubject = Object.fromEntries(
  [...new Set(records.map((record) => record.subject))]
    .sort()
    .map((subject) => [subject, records.filter((record) => record.subject === subject).length]),
);
const bySource = Object.fromEntries(
  [...new Set(records.map((record) => record.sourceLabel))]
    .sort()
    .map((sourceLabel) => [sourceLabel, records.filter((record) => record.sourceLabel === sourceLabel).length]),
);

const report = {
  generatedAt: new Date().toISOString(),
  totalUnmapped: records.length,
  eligibleForTopicOnlyRelease: records.filter((record) => record.otherReleaseBlocker === null).length,
  bySubject,
  bySource,
  records,
};

await writeFile("reports/unmapped_authorised_topic_inventory.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  totalUnmapped: report.totalUnmapped,
  eligibleForTopicOnlyRelease: report.eligibleForTopicOnlyRelease,
  bySubject: report.bySubject,
  bySource: report.bySource,
}, null, 2));
