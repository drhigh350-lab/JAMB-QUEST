import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type Question = { externalId: string; subject: "Biology"; question: string; options: string[]; answerIndex: number; explanation: string; topic: string };
const manifest = JSON.parse(readFileSync("reports/final_biology_diagram_questions_aug17.json", "utf8")) as { questions: Question[] };
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for final Biology diagram import");
const result = await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied final Biology image questions · verified key and explanation",
  permissionNote: "Owner supplied the reference screenshots, answer key, and explanations for use in JAMB Quest. Two repeated answer-key entries were excluded before import.",
  fileName: "final-biology-image-questions-owner-supplied.json",
  storageKey: "owner-supplied/final-biology-image-questions-owner-supplied.json",
  questions: manifest.questions.map((question) => ({ ...question, difficulty: "medium" as const })),
});
console.log(JSON.stringify(result, null, 2));
