import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const questions = JSON.parse(
  await readFile("/home/ubuntu/jamb-import-staging/owner_chemistry_1_250_stage.json", "utf8"),
) as Array<Record<string, unknown>>;

const payload = authorisedImportSchema.parse({
  sourceLabel: "Owner-supplied Chemistry 1–250 batch · 22 Aug 2026",
  permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  fileName: "pasted_content_chemistry_1_250.txt",
  storageKey: "owner-upload://2026-08-22/pasted-content-chemistry-1-250",
  questions: questions.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
});

console.log(JSON.stringify({ valid: true, questionCount: payload.questions.length, topics: [...new Set(payload.questions.map((question) => question.topic))] }, null, 2));
