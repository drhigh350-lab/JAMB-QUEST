import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, hasEmbeddedOptionMetadata } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";
import { writeFile } from "node:fs/promises";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({
  id: questionItems.id,
  subject: questionItems.subject,
  topic: questionItems.topic,
  questionText: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  explanation: questionItems.explanation,
  sourceLabel: questionSources.label,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review")));

function contentReadiness(row: typeof rows[number]) {
  try {
    const options = JSON.parse(row.optionsJson);
    if (!Array.isArray(options) || options.length < 4 || options.length > 5) return "invalid option count";
    if (options.some((option) => typeof option !== "string" || !option.trim() || hasEmbeddedOptionMetadata(option))) return "invalid option content";
    if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex >= options.length) return "answer index out of range";
    const mapped = resolveSyllabusTopic(row.subject as SyllabusSubject, row.topic);
    if (!mapped) return "unmapped syllabus topic";
    const lines = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const exempt = row.subject === "Use of English" && mapped === "Approved reading text" && lines.length === 0;
    if (!exempt && lines.length > 5) return "explanation exceeds five lines";
    return "ready_for_approval";
  } catch {
    return "unreadable option JSON";
  }
}

const summary = new Map<string, number>();
const sourceSummary = new Map<string, Map<string, number>>();
const readyIds: number[] = [];
for (const row of rows) {
  const outcome = contentReadiness(row);
  summary.set(outcome, (summary.get(outcome) ?? 0) + 1);
  const source = sourceSummary.get(row.sourceLabel) ?? new Map<string, number>();
  source.set(outcome, (source.get(outcome) ?? 0) + 1);
  sourceSummary.set(row.sourceLabel, source);
  if (outcome === "ready_for_approval") readyIds.push(row.id);
}
const report = {
  needsReviewRows: rows.length,
  readiness: Object.fromEntries([...summary.entries()].sort(([a], [b]) => a.localeCompare(b))),
  sources: Object.fromEntries([...sourceSummary.entries()].map(([label, outcomes]) => [label, Object.fromEntries([...outcomes.entries()].sort(([a], [b]) => a.localeCompare(b)))])),
  readyIds,
};
await writeFile("reports/needs_review_readiness_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ needsReviewRows: report.needsReviewRows, readiness: report.readiness }, null, 2));
