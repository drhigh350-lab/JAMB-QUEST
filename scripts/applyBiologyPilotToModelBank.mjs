import { readFile, writeFile } from "node:fs/promises";

const bankPath = "/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000.json";
const pilotPath = "/home/ubuntu/jamb-quiz-game/biology-explanation-pilot.output.json";
const outputPath = "/home/ubuntu/jamb_question_bank/jamb_high_yield_practice_bank_1000_biology_pilot.json";
const bank = JSON.parse(await readFile(bankPath, "utf8"));
const pilot = JSON.parse(await readFile(pilotPath, "utf8"));
const approved = new Map(pilot.filter((record) => record.quality_gate && !record.needs_review).map((record) => [record.id, record.lines.join("\n")]));
let updated = 0;
for (const question of bank.questions) {
  const explanation = approved.get(question.id);
  if (explanation) {
    question.explanation = explanation;
    updated += 1;
  }
}
if (updated !== approved.size) throw new Error(`Applied ${updated} pilot explanations but expected ${approved.size}`);
await writeFile(outputPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(JSON.stringify({ inputQuestions: bank.questions.length, approvedPilotExplanations: approved.size, updated, outputPath }, null, 2));
