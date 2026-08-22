import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const questions = JSON.parse(
  await readFile("/home/ubuntu/jamb-import-staging/owner_biology_physics_250_stage.json", "utf8"),
) as Array<Record<string, unknown>>;

const groups = new Map<string, Array<Record<string, unknown>>>();
for (const question of questions) {
  const sourceLabel = String(question.sourceLabel);
  groups.set(sourceLabel, [...(groups.get(sourceLabel) ?? []), question]);
}

const results = [...groups.entries()].map(([sourceLabel, records]) => {
  const payload = authorisedImportSchema.parse({
    sourceLabel,
    permissionNote: "Owner-supplied study content. Imported as authorised JAMB Quest practice material; source wording and answer key remain attributable to the owner-supplied batch.",
    fileName: "pasted_content_biology_101_250_physics_1_250.txt",
    storageKey: "owner-upload://2026-08-22/pasted-content-biology-101-250-physics-1-250",
    questions: records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  return {
    sourceLabel,
    questionCount: payload.questions.length,
    topics: [...new Set(payload.questions.map((question) => question.topic))],
  };
});

console.log(JSON.stringify({ valid: true, questionCount: questions.length, results }, null, 2));
