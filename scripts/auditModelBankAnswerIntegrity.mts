import { writeFile } from "node:fs/promises";
import { modelQuestionIntegrityReasons } from "../server/modelQuestionIntegrity";

const modelBankUrl = "http://127.0.0.1:3000/manus-storage/jamb_high_yield_practice_bank_1000_natural_explanations_817e6822.json";
const response = await fetch(modelBankUrl);
if (!response.ok) throw new Error(`Unable to load active model bank: ${response.status}`);
const payload = await response.json();
const questions = Array.isArray(payload.questions) ? payload.questions : [];
const flagged = questions
  .map((question) => ({ id: question.id, reasons: modelQuestionIntegrityReasons(question) }))
  .filter((question) => question.reasons.length > 0);
const report = {
  auditedAt: new Date().toISOString(),
  modelBankUrl,
  totalQuestions: questions.length,
  structuralAnswerIntegrityViolations: flagged.length,
  flagged,
  verifiedScope: ["non-empty question text", "exactly four non-empty distinct options", "no answer/explanation spillover in options", "A-D answer index", "answer text matches indexed option"],
  notVerifiedByThisDeterministicAudit: ["factual correctness of each keyed answer", "ambiguity of question wording", "syllabus validity beyond stored metadata"],
  result: flagged.length === 0 ? "pass" : "fail",
};
if (report.totalQuestions !== 1000) throw new Error(`Expected 1000 model questions; found ${report.totalQuestions}.`);
if (report.structuralAnswerIntegrityViolations !== 0) throw new Error(`Found ${report.structuralAnswerIntegrityViolations} structural answer-integrity violations.`);
await writeFile("reports/model_bank_answer_integrity_audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
