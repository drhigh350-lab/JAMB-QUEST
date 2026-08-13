import { readFile } from "node:fs/promises";

const bank = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_4.json", "utf8"));
const names = ["biology-explanation-pilot.output.json", "biology-explanation-batch-2.output.json", "biology-explanation-batch-3.output.json", "biology-explanation-batch-4.output.json"];
const batches = await Promise.all(names.map((name) => readFile(`/home/ubuntu/jamb-quiz-game/${name}`, "utf8").then(JSON.parse)));
const records = batches.flat();
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
console.log(JSON.stringify({ verified: true, totalQuestions: bank.questions.length, approvedIntegrated: approved.length, flaggedHeldBack: flagged.length, batches: batches.map((batch) => ({ total: batch.length, approved: batch.filter((record) => record.quality_gate && !record.needs_review).length })) }, null, 2));
