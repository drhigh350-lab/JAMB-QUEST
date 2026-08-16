import { and, eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const subjects = new Set<SyllabusSubject>(["Use of English", "Biology", "Chemistry", "Physics"]);
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const lineCount = (value: string | null) => (value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({
  id: questionItems.id,
  externalId: questionItems.externalId,
  subject: questionItems.subject,
  topic: questionItems.topic,
  question: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  explanation: questionItems.explanation,
  sourceLabel: questionSources.label,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "needs_review")));

const records = rows.map((row) => {
  const blockers: string[] = [];
  let options: unknown = [];
  try { options = JSON.parse(row.optionsJson); } catch { blockers.push("unreadable options JSON"); }
  const cleanOptions = Array.isArray(options) && options.every((option) => typeof option === "string") ? options as string[] : [];
  if (!subjects.has(row.subject as SyllabusSubject)) blockers.push("unsupported subject");
  else if (!resolveSyllabusTopic(row.subject as SyllabusSubject, row.topic)) blockers.push("missing official topic mapping");
  if (!row.question.trim()) blockers.push("blank question stem");
  if (cleanOptions.length < 4 || cleanOptions.length > 5) blockers.push("invalid option count");
  else if (cleanOptions.some((option) => !option.trim())) blockers.push("blank option text");
  else if (new Set(cleanOptions.map(normalise)).size !== cleanOptions.length) blockers.push("duplicate option text");
  if (row.answerIndex < 0 || row.answerIndex >= cleanOptions.length) blockers.push("answer index outside options");
  if (!row.explanation?.trim()) blockers.push("missing explanation");
  else if (lineCount(row.explanation) > 5) blockers.push("explanation exceeds five lines");
  return { ...row, explanationLines: lineCount(row.explanation), blockers, safeIfStatusApproved: blockers.length === 0 };
});
const byBlocker = records.reduce<Record<string, number>>((counts, record) => {
  const labels = record.blockers.length ? record.blockers : ["status-only hold"];
  labels.forEach((label) => { counts[label] = (counts[label] ?? 0) + 1; });
  return counts;
}, {});
const report = {
  total: records.length,
  readyIfApproved: records.filter((record) => record.safeIfStatusApproved).length,
  byBlocker: Object.fromEntries(Object.entries(byBlocker).sort(([left], [right]) => left.localeCompare(right))),
  bySource: Object.fromEntries([...new Set(records.map((record) => record.sourceLabel))].sort().map((source) => [source, records.filter((record) => record.sourceLabel === source).length])),
  records,
};
await writeFile("reports/needs_review_blocker_inventory.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ total: report.total, readyIfApproved: report.readyIfApproved, byBlocker: report.byBlocker, bySource: report.bySource }, null, 2));
