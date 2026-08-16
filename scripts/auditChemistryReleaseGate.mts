import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, hasEmbeddedOptionMetadata, toPlayableAuthorisedQuestion } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, subject: questionItems.subject, topic: questionItems.topic, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, explanationStatus: questionItems.explanationStatus, questionText: questionItems.questionText, sourceLabel: questionSources.label }).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.subject, "Chemistry")));
const reason = (row: typeof rows[number]) => {
  if (row.explanationStatus !== "approved") return `status:${row.explanationStatus}`;
  try {
    const options = JSON.parse(row.optionsJson);
    if (!Array.isArray(options) || options.length < 4 || options.length > 5) return "invalid option count";
    if (options.some((option) => typeof option !== "string" || !option.trim() || hasEmbeddedOptionMetadata(option))) return "invalid option content";
    if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex >= options.length) return "answer index out of range";
    if (!resolveSyllabusTopic("Chemistry" as SyllabusSubject, row.topic)) return "unmapped syllabus topic";
    const lines = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 5) return "explanation exceeds five lines";
    return toPlayableAuthorisedQuestion(row) ? "playable" : "other mapper rejection";
  } catch { return "unreadable option JSON"; }
};
const holds = rows.map((row) => ({ row, outcome: reason(row) })).filter((item) => item.outcome !== "playable");
const outcomes = holds.reduce<Record<string, number>>((counts, item) => { counts[item.outcome] = (counts[item.outcome] ?? 0) + 1; return counts; }, {});
const report = { total: rows.length, approved: rows.filter((row) => row.explanationStatus === "approved").length, playable: rows.length - holds.length, outcomes, holds: holds.map((item) => ({ id: item.row.id, topic: item.row.topic, sourceLabel: item.row.sourceLabel, outcome: item.outcome, question: item.row.questionText })) };
await writeFile("reports/chemistry_release_gate_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ total: report.total, approved: report.approved, playable: report.playable, outcomes: report.outcomes }, null, 2));
