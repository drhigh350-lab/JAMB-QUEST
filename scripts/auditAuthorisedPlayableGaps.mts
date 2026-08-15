import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, hasEmbeddedOptionMetadata, toPlayableAuthorisedQuestion } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";
import { writeFile } from "node:fs/promises";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({
  id: questionItems.id,
  subject: questionItems.subject,
  topic: questionItems.topic,
  difficulty: questionItems.difficulty,
  questionText: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  explanation: questionItems.explanation,
  explanationStatus: questionItems.explanationStatus,
  sourceLabel: questionSources.label,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.isActive, 1), eq(questionSources.sourceType, "authorised")));

function reason(row: typeof rows[number]) {
  if (row.explanationStatus !== "approved") return `status:${row.explanationStatus}`;
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
  } catch {
    return "unreadable option JSON";
  }
  return toPlayableAuthorisedQuestion(row) ? "playable" : "other mapper rejection";
}

const grouped = new Map<string, number>();
const bySource = new Map<string, Map<string, number>>();
for (const row of rows) {
  const outcome = reason(row);
  grouped.set(outcome, (grouped.get(outcome) ?? 0) + 1);
  const source = bySource.get(row.sourceLabel) ?? new Map<string, number>();
  source.set(outcome, (source.get(outcome) ?? 0) + 1);
  bySource.set(row.sourceLabel, source);
}
const report = {
  totalActiveAuthorisedRows: rows.length,
  playableRows: rows.filter((row) => reason(row) === "playable").length,
  outcomes: Object.fromEntries([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))),
  sources: Object.fromEntries([...bySource.entries()].map(([label, outcomes]) => [label, Object.fromEntries([...outcomes.entries()].sort(([a], [b]) => a.localeCompare(b)))])),
};
await writeFile("reports/authorised_playable_gap_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ total: report.totalActiveAuthorisedRows, playable: report.playableRows, outcomes: report.outcomes }, null, 2));
