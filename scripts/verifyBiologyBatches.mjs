import { readFile } from "node:fs/promises";

const bank = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_2.json", "utf8"));
const pilot = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/biology-explanation-pilot.output.json", "utf8"));
const batch2 = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/biology-explanation-batch-2.output.json", "utf8"));
const records = [...pilot, ...batch2];
const approved = records.filter((record) => record.quality_gate && !record.needs_review);
const flagged = records.filter((record) => record.needs_review);
const bankById = new Map(bank.questions.map((question) => [question.id, question]));
for (const record of approved) {
  const question = bankById.get(record.id);
  if (!question) throw new Error(`Missing approved record ${record.id}`);
  const lines = question.explanation.split(/\r?\n/).filter(Boolean);
  if (lines.length !== 6 || lines.join(" ").split(/\s+/).length < 75) throw new Error(`Quality gate failed for ${record.id}`);
}
for (const record of flagged) {
  const question = bankById.get(record.id);
  if (!question) throw new Error(`Missing flagged record ${record.id}`);
  if (question.explanation.split(/\r?\n/).filter(Boolean).length >= 6) throw new Error(`Flagged record integrated unexpectedly: ${record.id}`);
}
console.log(JSON.stringify({ verified: true, totalQuestions: bank.questions.length, approvedIntegrated: approved.length, flaggedHeldBack: flagged.length, batches: { pilot: pilot.length, batch2: batch2.length } }, null, 2));
