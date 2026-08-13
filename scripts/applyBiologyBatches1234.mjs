import { readFile, writeFile } from "node:fs/promises";

const base = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000.json", "utf8"));
const names = ["biology-explanation-pilot.output.json", "biology-explanation-batch-2.output.json", "biology-explanation-batch-3.output.json", "biology-explanation-batch-4.output.json"];
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
const outputPath = "/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_4.json";
await writeFile(outputPath, `${JSON.stringify(base, null, 2)}\n`);
console.log(JSON.stringify({ totalQuestions: base.questions.length, approvedIntegrated: updated, heldBack: records.filter((record) => record.needs_review).map((record) => record.id), batches: batches.map((batch) => ({ total: batch.length, approved: batch.filter((record) => record.quality_gate && !record.needs_review).length })) }, null, 2));
