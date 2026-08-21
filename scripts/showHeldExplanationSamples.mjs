import { readFile } from "node:fs/promises";
const bank = JSON.parse(await readFile("/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json", "utf8"));
const audit = JSON.parse(await readFile("/home/ubuntu/jamb-quiz-game/reports/explanations_batch8_rectified_literal_audit.json", "utf8"));
const ids = ["PHY-105", "PHY-106"];
const questions = bank.questions ?? bank.items ?? bank.records;
for (const id of ids) {
  const question = questions.find((item) => String(item.id ?? item.record_id) === id);
  console.log(JSON.stringify({ id, question: question?.question ?? question?.question_text, options: question?.options ?? [question?.option_a, question?.option_b, question?.option_c, question?.option_d], answer: question?.answer ?? question?.answer_text, heldExplanation: audit.explanations[id] }, null, 2));
}
