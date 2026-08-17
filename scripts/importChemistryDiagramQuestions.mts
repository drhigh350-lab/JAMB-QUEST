import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type Record = { externalId: string; subject: "Chemistry"; question: string; options: string[]; answerIndex: number; explanation: string; topic: string };
const staged = JSON.parse(readFileSync("reports/chemistry_diagram_questions_aug17.json", "utf8")) as { questions: Record[] };
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for controlled import");

const result = await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied Chemistry diagram questions · verified key and explanation",
  permissionNote: "Owner supplied the reference screenshots, answer key, and explanations for use in JAMB Quest.",
  fileName: "chemistry-diagram-questions-owner-supplied.json",
  storageKey: "owner-supplied/chemistry-diagram-questions-owner-supplied.json",
  questions: staged.questions.map((question) => ({ ...question, difficulty: "medium" as const })),
});

console.log(JSON.stringify(result, null, 2));
