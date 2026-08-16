import { and, eq, inArray } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
import { getDb } from "../server/db";
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const subjects = ["Use of English", "Biology", "Chemistry", "Physics"] as const;
const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, question: questionItems.questionText, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, explanationStatus: questionItems.explanationStatus, sourceLabel: questionSources.label })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), inArray(questionItems.subject, subjects)));
const candidates = rows.flatMap((row) => {
  const lines = (row.explanation ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  let options: unknown[] = [];
  try { options = JSON.parse(row.optionsJson); } catch {}
  const topicResolved = subjects.includes(row.subject as any) ? resolveSyllabusTopic(row.subject as any, row.topic) : null;
  const structuralSafe = options.length >= 4 && options.length <= 5 && options.every((x) => typeof x === "string" && x.trim()) && Number.isInteger(row.answerIndex) && row.answerIndex >= 0 && row.answerIndex < options.length;
  return lines.length > 5 && Boolean(topicResolved) && structuralSafe ? [{ ...row, lineCount: lines.length, wordCount: (row.explanation ?? "").trim().split(/\s+/).filter(Boolean).length, topicResolved, structuralSafe }] : [];
});
const report = { generatedAt: new Date().toISOString(), totalCandidates: candidates.length, bySubject: Object.fromEntries(subjects.map((subject) => [subject, candidates.filter((x) => x.subject === subject)])) };
await writeFile("reports/all_subject_overcap_candidates.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ totalCandidates: report.totalCandidates, bySubject: Object.fromEntries(subjects.map((subject) => [subject, report.bySubject[subject].length])) }));
