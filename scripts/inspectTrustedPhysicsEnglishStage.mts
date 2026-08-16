import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

type Record = {
  externalId: string;
  subject: string;
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  sourceLabel: string;
  permissionNote: string;
};

const records = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/trusted_physics_english_aug16.staged.json", "utf8")) as Record[];
const oversized = records
  .filter((record) => (record.explanation?.length ?? 0) > 4000 || record.question.length > 8000 || record.options.some((option) => option.length > 1000))
  .map((record) => ({ externalId: record.externalId, explanationLength: record.explanation?.length ?? 0, questionLength: record.question.length, optionLengths: record.options.map((option) => option.length) }));
const validations = [...new Set(records.map((record) => record.sourceLabel))].map((sourceLabel) => {
  const subset = records.filter((record) => record.sourceLabel === sourceLabel);
  const result = authorisedImportSchema.safeParse({
    sourceLabel,
    permissionNote: subset[0].permissionNote,
    fileName: "trusted_physics_english_aug16.staged.json",
    storageKey: "owner-markdown://trusted_physics_english_aug16.staged.json",
    questions: subset.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
  return result.success ? { sourceLabel, valid: true } : { sourceLabel, valid: false, issues: result.error.issues };
});
console.log(JSON.stringify({ total: records.length, oversized, validations }, null, 2));
