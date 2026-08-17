import { readFile, writeFile } from "node:fs/promises";
import { getPlayableAuthorisedQuestions } from "/home/ubuntu/jamb-quiz-game/server/db";

const authorised = await getPlayableAuthorisedQuestions();
const response = await fetch("http://127.0.0.1:3000/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json");
if (!response.ok) throw new Error(`Model bank request failed: ${response.status}`);
const modelPayload = await response.json() as { questions?: Array<Record<string, unknown>> };
const model = (modelPayload.questions ?? []).map((row) => ({
  id: String(row.id ?? ""),
  subject: row.subject,
  topic: row.topic,
  question: row.question,
  options: row.options,
  answer_index: row.answer_index,
  explanation: row.explanation,
  diagram_url: row.diagram_url ?? null,
  source_classification: "model-practice-bank",
}));
const authorisedExport = authorised.map((row) => ({
  id: row.id,
  subject: row.subject,
  topic: row.topic,
  question: row.question,
  options: row.options,
  answer_index: row.answer_index,
  explanation: row.explanation,
  diagram_url: row.diagram_url ?? null,
  source_classification: "authorised-imported",
}));
const questions = [...authorisedExport, ...model];
const exportPayload = {
  format: "JAMB Quest unified playable question export",
  generatedAt: new Date().toISOString(),
  total: questions.length,
  subjectCounts: Object.fromEntries(["Use of English", "Biology", "Chemistry", "Physics"].map((subject) => [subject, questions.filter((q) => q.subject === subject).length])),
  questions,
};
await writeFile("/home/ubuntu/jamb-quiz-game/reports/jamb_quest_question_bank_aug17.json", `${JSON.stringify(exportPayload, null, 2)}\n`);
console.log(JSON.stringify({ total: exportPayload.total, subjectCounts: exportPayload.subjectCounts, output: "reports/jamb_quest_question_bank_aug17.json" }, null, 2));
