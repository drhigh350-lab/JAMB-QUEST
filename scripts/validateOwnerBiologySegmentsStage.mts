import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const questions = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/owner_biology_segments_1_25_51_75_76_100_eligible.json", "utf8"));
const payload = authorisedImportSchema.parse({
  sourceLabel: "Owner-supplied Biology segments · 22 Aug 2026",
  permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
  fileName: "pasted_content_biology_1_25_51_75_76_100.txt",
  storageKey: "owner-upload://2026-08-22/pasted_content_biology_segments",
  questions: questions.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }: Record<string, unknown>) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
});
console.log(JSON.stringify({ valid: true, questionCount: payload.questions.length, topics: [...new Set(payload.questions.map((question) => question.topic))] }, null, 2));
