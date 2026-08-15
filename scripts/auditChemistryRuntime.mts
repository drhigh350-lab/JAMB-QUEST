import { and, eq, like } from "drizzle-orm";
import { getDb, toPlayableAuthorisedQuestion } from "../server/db";
import { questionItems, questionSources } from "../drizzle/schema";
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
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(
  and(eq(questionSources.isActive, 1), like(questionSources.label, "Owner Chemistry DOCX%")),
);

const holdReasons = (row: typeof rows[number]) => {
  const reasons: string[] = [];
  if (row.subject !== "Chemistry") reasons.push("wrong-subject");
  if (row.explanationStatus !== "approved") reasons.push(`status:${row.explanationStatus}`);
  const mapped = row.subject === "Chemistry" ? resolveSyllabusTopic("Chemistry" as SyllabusSubject, row.topic) : null;
  if (!mapped) reasons.push("unmapped-topic");
  let options: unknown;
  try { options = JSON.parse(row.optionsJson); } catch { options = null; }
  if (!Array.isArray(options) || options.length < 4 || options.length > 5 || options.some((value) => typeof value !== "string" || !value.trim())) reasons.push("invalid-options");
  if (!Number.isInteger(row.answerIndex) || !Array.isArray(options) || row.answerIndex < 0 || row.answerIndex >= options.length) reasons.push("invalid-answer-index");
  const lineCount = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
  if (lineCount > 5) reasons.push(`explanation-lines:${lineCount}`);
  return { reasons, mappedTopic: mapped, explanationLines: lineCount };
};

const details = rows.map((row) => ({ id: row.id, sourceLabel: row.sourceLabel, topic: row.topic, ...holdReasons(row), runtimePlayable: toPlayableAuthorisedQuestion(row) !== null }));
const report = {
  generatedAt: new Date().toISOString(),
  sourcePattern: "Owner Chemistry DOCX%",
  storedActiveCount: rows.length,
  runtimePlayableCount: details.filter((item) => item.runtimePlayable).length,
  heldCount: details.filter((item) => !item.runtimePlayable).length,
  holdReasonCounts: details.flatMap((item) => item.reasons).reduce<Record<string, number>>((counts, reason) => { counts[reason] = (counts[reason] ?? 0) + 1; return counts; }, {}),
  details,
};
await writeFile("reports/chemistry_runtime_audit.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ...report, details: undefined }, null, 2));
process.exit(0);
