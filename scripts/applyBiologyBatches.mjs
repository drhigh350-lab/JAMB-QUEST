import { readFile, writeFile } from "node:fs/promises";

const base = JSON.parse(await readFile("/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000.json", "utf8"));
const pilot = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/biology-explanation-pilot.output.json", "utf8"));
const batch2 = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/biology-explanation-batch-2.output.json", "utf8"));
const approved = [...pilot, ...batch2].filter((record) => record.quality_gate && !record.needs_review);
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
const outputPath = "/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_batches_1_2.json";
await writeFile(outputPath, `${JSON.stringify(base, null, 2)}\n`);
console.log(JSON.stringify({ totalQuestions: base.questions.length, approvedIntegrated: updated, pilotApproved: pilot.filter((record) => record.quality_gate && !record.needs_review).length, batch2Approved: batch2.filter((record) => record.quality_gate && !record.needs_review).length, outputPath }, null, 2));
