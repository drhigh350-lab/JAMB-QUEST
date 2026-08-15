import { writeFile } from "node:fs/promises";
import { naturalExplanationReasons } from "../server/explanationStyle";

const modelBankUrl = "http://127.0.0.1:3000/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json";
const response = await fetch(modelBankUrl);
if (!response.ok) throw new Error(`Unable to load active model bank: ${response.status}`);
const payload = await response.json();
const questions = Array.isArray(payload.questions) ? payload.questions : [];
const flagged = questions
  .map((question) => ({ id: question.id, reasons: naturalExplanationReasons(question.explanation ?? "") }))
  .filter((question) => question.reasons.length > 0);
const shortExplanationCount = questions.filter((question) => (question.explanation ?? "").trim().split(/\s+/).filter(Boolean).length < 25).length;
const report = {
  auditedAt: new Date().toISOString(),
  modelBankUrl,
  totalQuestions: questions.length,
  templateStyleFlagged: flagged.length,
  flagged,
  shortExplanationThresholdWords: 25,
  shortExplanationCount,
  result: flagged.length === 0 ? "pass" : "fail",
};
if (report.totalQuestions !== 1000) throw new Error(`Expected 1000 model questions; found ${report.totalQuestions}.`);
if (report.templateStyleFlagged !== 0) throw new Error(`Found ${report.templateStyleFlagged} model explanations that violate the natural-style contract.`);
await writeFile("reports/model_explanation_style_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
