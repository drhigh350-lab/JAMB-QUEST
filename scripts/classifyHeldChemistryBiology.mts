import { and, eq, inArray } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { questionItems, questionSources } from "../drizzle/schema";
import { resolveSyllabusTopic } from "../shared/syllabusTopicMap";
import { getDb } from "../server/db";
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const rows = await db.select({ id: questionItems.id, externalId: questionItems.externalId, subject: questionItems.subject, topic: questionItems.topic, question: questionItems.questionText, optionsJson: questionItems.optionsJson, answerIndex: questionItems.answerIndex, explanation: questionItems.explanation, explanationStatus: questionItems.explanationStatus, sourceLabel: questionSources.label })
  .from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.sourceType, "authorised"), eq(questionSources.isActive, 1), inArray(questionItems.subject, ["Biology", "Chemistry"])));
const records = rows.map((row) => {
  let options: unknown[] = [];
  try { options = JSON.parse(row.optionsJson); } catch {}
  const lines = (row.explanation ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const topicResolved = resolveSyllabusTopic(row.subject as "Biology" | "Chemistry", row.topic);
  const structuralSafe = options.length >= 4 && options.length <= 5 && options.every((x) => typeof x === "string" && x.trim()) && Number.isInteger(row.answerIndex) && row.answerIndex >= 0 && row.answerIndex < options.length;
  const explanationOnlyCandidate = Boolean(row.explanation?.trim()) && Boolean(topicResolved) && structuralSafe && (row.explanationStatus !== "approved" || lines.length > 5);
  const overCapCandidate = Boolean(row.explanation?.trim()) && lines.length > 5 && Boolean(topicResolved) && structuralSafe;
  return { ...row, options, lineCount: lines.length, wordCount: (row.explanation ?? "").trim().split(/\s+/).filter(Boolean).length, topicResolved, structuralSafe, explanationOnlyCandidate, overCapCandidate };
});
const held = records.filter((x) => x.explanationStatus !== "approved");
const shorteningCandidates = records.filter((x) => x.overCapCandidate || x.explanationOnlyCandidate);
const report = { generatedAt: new Date().toISOString(), totalSubjectRows: records.length, held: held.length, explanationOnlyCandidates: held.filter((x) => x.explanationOnlyCandidate).length, shorteningCandidates: shorteningCandidates.length, bySubject: { Biology: records.filter((x) => x.subject === "Biology"), Chemistry: records.filter((x) => x.subject === "Chemistry") }, shorteningBySubject: { Biology: shorteningCandidates.filter((x) => x.subject === "Biology"), Chemistry: shorteningCandidates.filter((x) => x.subject === "Chemistry") } };
await writeFile("reports/held_chemistry_biology_classifier.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ totalSubjectRows: report.totalSubjectRows, held: report.held, explanationOnlyCandidates: report.explanationOnlyCandidates, shorteningCandidates: report.shorteningCandidates, Biology: report.bySubject.Biology.length, Chemistry: report.bySubject.Chemistry.length, shorteningBiology: report.shorteningBySubject.Biology.length, shorteningChemistry: report.shorteningBySubject.Chemistry.length }));
