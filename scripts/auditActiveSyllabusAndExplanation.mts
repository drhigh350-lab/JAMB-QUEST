import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const db = await getDb();
if (!db) throw new Error("Database is unavailable.");

const records = await db
  .select({
    id: questionItems.id,
    sourceLabel: questionSources.label,
    subject: questionItems.subject,
    topic: questionItems.topic,
    explanation: questionItems.explanation,
  })
  .from(questionItems)
  .innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));

const audit = records.map((record) => {
  const mappedTopic = resolveSyllabusTopic(record.subject as SyllabusSubject, record.topic);
  const lines = String(record.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words = String(record.explanation ?? "").trim().split(/\s+/).filter(Boolean);
  const isApprovedReadingText = record.subject === "Use of English" && mappedTopic === "Approved reading text";
  const explanationStatus = isApprovedReadingText && words.length === 0
    ? "exempt-reading-text"
    : lines.length > 5
      ? "over-five-lines"
      : words.length < 8
        ? "too-short"
        : "within-cap";
  return {
    questionId: record.id,
    sourceLabel: record.sourceLabel,
    subject: record.subject,
    originalTopic: record.topic,
    mappedTopic,
    topicStatus: mappedTopic ? "mapped" : "unmapped",
    explanationStatus,
    explicitLineCount: lines.length,
    wordCount: words.length,
  };
});

const countBy = (key: "topicStatus" | "explanationStatus") => Object.entries(audit.reduce<Record<string, number>>((counts, record) => {
  const value = record[key];
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {})).map(([value, count]) => ({ value, count }));

const report = {
  auditedAt: new Date().toISOString(),
  totalActiveApproved: audit.length,
  topicStatus: countBy("topicStatus"),
  explanationStatus: countBy("explanationStatus"),
  topicExceptions: audit.filter((record) => record.topicStatus === "unmapped"),
  explanationExceptions: audit.filter((record) => ["over-five-lines", "too-short"].includes(record.explanationStatus)),
};

await writeFile("/home/ubuntu/jamb-quiz-game/reports/active_syllabus_explanation_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ totalActiveApproved: report.totalActiveApproved, topicStatus: report.topicStatus, explanationStatus: report.explanationStatus, topicExceptionCount: report.topicExceptions.length, explanationExceptionCount: report.explanationExceptions.length }, null, 2));
