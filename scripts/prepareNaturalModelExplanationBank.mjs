import { mkdir, writeFile } from "node:fs/promises";

const sourceUrl = "https://3000-iobewn6v6k0sqroneio5d-c3a4c244.us4.manus.computer/manus-storage/jamb_high_yield_practice_bank_1000_biology_batches_1_5_759ba726.json";
const outputDir = "/home/ubuntu/webdev-static-assets";
const outputPath = `${outputDir}/jamb_high_yield_practice_bank_1000_natural_explanations.json`;
const reportPath = "/home/ubuntu/jamb-import-staging/model_explanation_label_repair_receipt.json";
const labels = /(^|\n)\s*(Concept|Mechanism|Observation|Distinction|Therefore|Answer|Core idea|Topic focus|Reasoning step|Check the alternatives|Exam takeaway)\s*:\s*/gi;

const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Unable to load the current model bank: ${response.status}`);
const payload = await response.json();
if (!Array.isArray(payload.questions)) throw new Error("The current model bank has no questions array.");

const repairedIds = [];
for (const question of payload.questions) {
  const original = typeof question.explanation === "string" ? question.explanation : "";
  const repaired = original.replace(labels, "$1");
  if (repaired !== original) {
    repairedIds.push(question.id);
    question.explanation = repaired;
  }
}
if (repairedIds.length !== 8) throw new Error(`Expected 8 labelled explanations; found ${repairedIds.length}.`);
const remainingLabels = payload.questions.filter((question) => labels.test(question.explanation ?? "")).map((question) => question.id);
if (remainingLabels.length) throw new Error(`Label repair incomplete: ${remainingLabels.join(", ")}`);

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
await writeFile(reportPath, `${JSON.stringify({ sourceUrl, outputPath, questionCount: payload.questions.length, repairedIds, remainingLabelledExplanations: remainingLabels.length }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, questionCount: payload.questions.length, repairedIds, remainingLabelledExplanations: remainingLabels.length }, null, 2));
