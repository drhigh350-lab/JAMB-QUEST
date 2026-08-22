import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";
import { useOfEnglishInstruction } from "../shared/useOfEnglishInstructions";

const stagedPath = "/home/ubuntu/jamb-import-staging/owner_english_continuation_126_to_250_eligible.json";
const questions = JSON.parse(await readFile(stagedPath, "utf8"));
if (questions.some((question: { question?: string; topic?: string }) => typeof question.question !== "string" || typeof question.topic !== "string" || (!/^(?:Choose|Read the passage)/.test(question.question) && useOfEnglishInstruction(question.topic, question.question) !== ""))) {
  throw new Error("Every staged owner-English continuation question must begin with an explicit learner instruction.");
}
const payload = authorisedImportSchema.parse({
  sourceLabel: "Owner-supplied English continuation · 22 Aug 2026",
  permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  fileName: "pasted_content_english_126_to_250.txt",
  storageKey: "owner-upload://2026-08-22/pasted_content_english_126_to_250",
  questions: questions.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }: Record<string, unknown>) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
});
console.log(JSON.stringify({ valid: true, questionCount: payload.questions.length, explicitInstructionCount: questions.length, topics: [...new Set(payload.questions.map((question) => question.topic))] }, null, 2));
