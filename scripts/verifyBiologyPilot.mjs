import { readFile } from "node:fs/promises";

const bank = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_pilot.json", "utf8"));
const pilot = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/biology-explanation-pilot.output.json", "utf8"));
const approved = new Map(pilot.filter((record) => record.quality_gate && !record.needs_review).map((record) => [record.id, record]));
const flagged = new Map(pilot.filter((record) => record.needs_review).map((record) => [record.id, record]));
const bankById = new Map(bank.questions.map((question) => [question.id, question]));
for (const [id, record] of approved) {
  const question = bankById.get(id);
  if (!question) throw new Error(`Approved pilot question ${id} is missing from the bank`);
  const lines = question.explanation.split(/\r?\n/).filter(Boolean);
  if (lines.length !== 6 || lines.join(" ").split(/\s+/).length < 75) throw new Error(`Enriched explanation failed the six-line quality gate for ${id}`);
}
for (const [id, record] of flagged) {
  const question = bankById.get(id);
  if (!question) throw new Error(`Flagged pilot question ${id} is missing from the bank`);
  if (question.explanation.split(/\r?\n/).filter(Boolean).length >= 6) throw new Error(`Flagged explanation ${id} was integrated unexpectedly`);
}
console.log(JSON.stringify({ verified: true, totalQuestions: bank.questions.length, approvedIntegrated: approved.size, flaggedHeldBack: flagged.size }, null, 2));
