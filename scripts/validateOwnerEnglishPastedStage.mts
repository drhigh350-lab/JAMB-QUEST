import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const stagedPath = "/home/ubuntu/jamb-import-staging/owner_english_pasted_batch_20260822_eligible.json";
const questions = JSON.parse(await readFile(stagedPath, "utf8"));
const payload = authorisedImportSchema.parse({
  sourceLabel: "Owner-supplied English practice batch · 22 Aug 2026",
  permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  fileName: "pasted_content_english_1_to_125.txt",
  storageKey: "owner-upload://2026-08-22/pasted_content_english_1_to_125",
  questions: questions.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }: Record<string, unknown>) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
});
console.log(JSON.stringify({ valid: true, questionCount: payload.questions.length, topics: [...new Set(payload.questions.map((question) => question.topic))] }, null, 2));
