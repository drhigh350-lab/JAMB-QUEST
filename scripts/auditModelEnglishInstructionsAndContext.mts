import { readFile, writeFile } from "node:fs/promises";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const INPUT_PATH = process.argv[2] ?? "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/model_bank_english_instruction_context_audit.json";

type ModelQuestion = {
  id: string;
  subject: string;
  topic?: string;
  question?: string;
  options?: unknown;
  explanation?: string;
};

function contextMayBeMissing(question: string) {
  if (/^(?:excerpt:|read the (?:brief )?(?:passage|extract|dialogue|conversation))/i.test(question.trim())) return false;
  const refersOutside = /\b(?:the|this)\s+(?:passage|extract|dialogue|conversation|poem|table|chart|diagram|figure)\b|\bline\s+\d+\b|\bunderlined\s+(?:word|expression|part)\b|\bthe\s+words?\s+in\s+(?:italics|bold)\b/i.test(question);
  const containsContext = /(?:passage|extract|dialogue|conversation|poem)\s*[:—-]|\n\s*(?:[“"']|\(?[A-Z][^?]{90,})/i.test(question);
  return refersOutside && !containsContext;
}

const payload = JSON.parse(await readFile(INPUT_PATH, "utf8")) as { questions: ModelQuestion[] };
const english = payload.questions.filter((question) => question.subject === "Use of English" && typeof question.question === "string");
const instructionRepairs = english.flatMap((question) => {
  const decision = withUseOfEnglishInstruction(question.topic ?? "", question.question!);
  return decision.changed ? [{ id: question.id, topic: question.topic ?? "", instruction: decision.instruction, questionPreview: question.question!.replace(/\s+/g, " ").slice(0, 240) }] : [];
});
const contextHolds = english.filter((question) => contextMayBeMissing(question.question!)).map((question) => ({
  id: question.id,
  topic: question.topic ?? "",
  reason: "The prompt refers to supporting text or emphasis that is not represented in the visible model-bank stem.",
  questionPreview: question.question!.replace(/\s+/g, " ").slice(0, 240),
}));
const report = {
  modelEnglishRecords: english.length,
  safeInstructionOnlyRepairs: instructionRepairs.length,
  contextSourceHolds: contextHolds.length,
  instructionRepairs,
  contextHolds,
};
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ modelEnglishRecords: report.modelEnglishRecords, safeInstructionOnlyRepairs: report.safeInstructionOnlyRepairs, contextSourceHolds: report.contextSourceHolds, reportPath: REPORT_PATH }, null, 2));
