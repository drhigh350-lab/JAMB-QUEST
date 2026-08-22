import { readFile, writeFile } from "node:fs/promises";
import { withUseOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const INPUT_PATH = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json";
const OUTPUT_PATH = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_model_v4_english_instructions.json";

type ModelQuestion = { id: string; subject: string; topic?: string; question?: string; [key: string]: unknown };
const payload = JSON.parse(await readFile(INPUT_PATH, "utf8")) as { questions: ModelQuestion[]; [key: string]: unknown };
let changed = 0;
const questions = payload.questions.map((question) => {
  if (question.subject !== "Use of English" || typeof question.question !== "string") return question;
  const decision = withUseOfEnglishInstruction(question.topic ?? "", question.question);
  if (!decision.changed) return question;
  changed += 1;
  return { ...question, question: decision.questionText };
});
if (questions.length !== payload.questions.length) throw new Error("Question count changed during instruction-only repair.");
const changedIds = questions.flatMap((question, index) => question.question !== payload.questions[index]?.question ? [question.id] : []);
if (changed !== changedIds.length) throw new Error("Instruction-only repair count did not match changed records.");
const protectedFieldChanges = questions.flatMap((question, index) => {
  const source = payload.questions[index]!;
  const protectedKeys = ["id", "subject", "topic", "options", "answer_index", "answer_text", "explanation", "diagram_url", "source"];
  return protectedKeys.filter((key) => JSON.stringify(question[key]) !== JSON.stringify(source[key])).map((key) => ({ id: question.id, key }));
});
if (protectedFieldChanges.length) throw new Error(`Protected model fields changed: ${JSON.stringify(protectedFieldChanges)}`);
await writeFile(OUTPUT_PATH, `${JSON.stringify({ ...payload, questions }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ totalQuestions: questions.length, englishInstructionsAdded: changed, changedIds, outputPath: OUTPUT_PATH }, null, 2));
