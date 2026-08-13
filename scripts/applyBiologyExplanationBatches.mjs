import { readFile, writeFile } from "node:fs/promises";

const batchNumber = Number(process.argv[2]);
if (!Number.isInteger(batchNumber) || batchNumber < 1) throw new Error("Usage: node scripts/applyBiologyExplanationBatches.mjs <batch-number>");
const base = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000.json", "utf8"));
const names = ["biology-explanation-pilot.output.json", ...Array.from({ length: Math.max(0, batchNumber - 1) }, (_, index) => `biology-explanation-batch-${index + 2}.output.json`)];
const batches = await Promise.all(names.map((name) => readFile(`/home/ubuntu/jamb-quiz-game/${name}`, "utf8").then(JSON.parse)));
const records = batches.flat();
const approved = records.filter((record) => record.quality_gate && !record.needs_review);
const explanations = new Map(approved.map((record) => [record.id, record.lines.join("\n")]));
let updated = 0;
for (const question of base.questions) {
  const explanation = explanations.get(question.id);
  if (explanation) {
    question.explanation = explanation;
    updated += 1;
  }
}
if (updated !== explanations.size) throw new Error(`Applied ${updated} explanations but expected ${explanations.size}`);
const outputPath = `/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_${batchNumber}.json`;
await writeFile(outputPath, `${JSON.stringify(base, null, 2)}\n`);
console.log(JSON.stringify({ batchNumber, totalQuestions: base.questions.length, approvedIntegrated: updated, heldBack: records.filter((record) => record.needs_review).map((record) => record.id), batches: batches.map((batch) => ({ total: batch.length, approved: batch.filter((record) => record.quality_gate && !record.needs_review).length })), outputPath }, null, 2));
