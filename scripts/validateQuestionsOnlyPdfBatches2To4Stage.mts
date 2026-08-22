import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_batches_2_to_4_answer_matched_eligible.json";
const expected = new Map([
  ["Owner PDF answer-matched Use of English 101–200 · 22 Aug 2026", 100],
  ["Owner PDF answer-matched Use of English 201–250 · 22 Aug 2026", 50],
  ["Owner PDF answer-matched Biology 1–50 · 22 Aug 2026", 50],
  ["Owner PDF answer-matched Biology 51–150 · 22 Aug 2026", 100],
]);

const staged = JSON.parse(await readFile(STAGED_PATH, "utf8")) as Array<{
  externalId: string;
  subject: "Use of English" | "Biology";
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
}>;
if (staged.length !== 300 || new Set(staged.map((record) => record.externalId)).size !== 300) {
  throw new Error("Expected exactly 300 unique, answer-matched records from PDF batches 2–4.");
}
const groups = [...expected.entries()].map(([sourceLabel, count]) => ({ sourceLabel, count, records: staged.filter((record) => record.sourceLabel === sourceLabel) }));
if (groups.some((group) => group.records.length !== group.count) || groups.reduce((sum, group) => sum + group.records.length, 0) !== staged.length) {
  throw new Error("The staged records do not match the expected four source-label groups and counts.");
}
for (const group of groups) {
  authorisedImportSchema.parse({
    sourceLabel: group.sourceLabel,
    permissionNote: group.records[0]?.permissionNote ?? "Missing permission note",
    fileName: "owner-answer-matched-pdf-batches-2-to-4.json",
    storageKey: "owner-markdown://answer-matched-pdf-batches-2-to-4.json",
    questions: group.records.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation })),
  });
}
console.log(JSON.stringify({ validatedCount: staged.length, sourceGroups: groups.map((group) => ({ sourceLabel: group.sourceLabel, count: group.records.length })) }, null, 2));
process.exit(0);
