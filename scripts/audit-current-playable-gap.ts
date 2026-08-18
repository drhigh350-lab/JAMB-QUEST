import { and, eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { getDb, hasEmbeddedOptionMetadata, normaliseQuestionStem, requiresDiagramAsset, toPlayableAuthorisedQuestion } from "../server/db";
import { resolveSyllabusTopic, type SyllabusSubject } from "../shared/syllabusTopicMap";

const OWNER_REJECTED_SCREENSHOT_BATCH = /^OWNER-(?:PHY|CHEM|BIO)-DIAGRAM-/;
const RECOVERED_OWNER_ORIGINAL_ASSET = /^\/manus-storage\/owner-(?:phy|chem|bio)-diagram-/i;
const PLAYABLE_SUBJECTS = new Set(["Use of English", "Biology", "Chemistry", "Physics"]);

const db = await getDb();
if (!db) throw new Error("Database unavailable");

const rows = await db.select({
  id: questionItems.id,
  externalId: questionItems.externalId,
  subject: questionItems.subject,
  topic: questionItems.topic,
  difficulty: questionItems.difficulty,
  questionText: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  answerIndex: questionItems.answerIndex,
  explanation: questionItems.explanation,
  diagramUrl: questionItems.diagramUrl,
  sourceLabel: questionSources.label,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id))
  .where(and(eq(questionSources.isActive, 1), eq(questionItems.explanationStatus, "approved")));

function exclusionReason(row: typeof rows[number]) {
  if (!PLAYABLE_SUBJECTS.has(row.subject)) return "unsupported_subject";
  if (row.externalId && OWNER_REJECTED_SCREENSHOT_BATCH.test(row.externalId) && (!row.diagramUrl || !RECOVERED_OWNER_ORIGINAL_ASSET.test(row.diagramUrl))) return "rejected_screenshot_without_original";
  const questionText = normaliseQuestionStem(row.questionText);
  let options: unknown;
  try { options = JSON.parse(row.optionsJson); } catch { return "invalid_options_json"; }
  if (!Array.isArray(options) || options.length < 4 || options.length > 5 || options.some((option) => typeof option !== "string" || !option.trim() || hasEmbeddedOptionMetadata(option))) return "invalid_options";
  if (!Number.isInteger(row.answerIndex) || row.answerIndex < 0 || row.answerIndex >= options.length) return "invalid_answer_index";
  const mappedTopic = resolveSyllabusTopic(row.subject as SyllabusSubject, row.topic);
  if (!mappedTopic) return "unmapped_topic";
  if (requiresDiagramAsset(questionText) && !row.diagramUrl) return "missing_required_diagram";
  const explanationLines = (row.explanation ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!(row.subject === "Use of English" && mappedTopic === "Approved reading text" && explanationLines.length === 0) && explanationLines.length > 5) return "explanation_over_five_lines";
  return "unknown";
}

const held = rows.filter((row) => !toPlayableAuthorisedQuestion(row));
const byReason = Object.entries(held.reduce<Record<string, number>>((acc, row) => {
  const reason = exclusionReason(row);
  acc[reason] = (acc[reason] ?? 0) + 1;
  return acc;
}, {})).sort(([a], [b]) => a.localeCompare(b));
const samples = held.slice(0, 300).map((row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, diagramUrl: row.diagramUrl, reason: exclusionReason(row), question: normaliseQuestionStem(row.questionText).slice(0, 180) }));
const missingDiagramHolds = held.filter((row) => exclusionReason(row) === "missing_required_diagram").map((row) => ({ id: row.id, externalId: row.externalId, subject: row.subject, topic: row.topic, sourceLabel: row.sourceLabel, question: normaliseQuestionStem(row.questionText), optionsJson: row.optionsJson, answerIndex: row.answerIndex, explanation: row.explanation }));

console.log(JSON.stringify({ rawApproved: rows.length, playable: rows.length - held.length, held: held.length, byReason, samples, missingDiagramHolds }, null, 2));
process.exit(0);
