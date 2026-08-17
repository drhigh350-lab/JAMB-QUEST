import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type DiagramQuestion = { externalId: string; subject: "Physics"; question: string; options: string[]; answerIndex: number; explanation: string; topic: string };
const staged = JSON.parse(readFileSync("reports/physics_diagram_questions_aug17.json", "utf8")) as { questions: DiagramQuestion[] };
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for controlled Physics diagram import");

const result = await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied Physics diagram questions · verified key and explanation",
  permissionNote: "Owner supplied the reference screenshots, answer key, and explanations for use in JAMB Quest.",
  fileName: "physics-diagram-questions-owner-supplied.json",
  storageKey: "owner-supplied/physics-diagram-questions-owner-supplied.json",
  questions: staged.questions.map((question) => ({ ...question, difficulty: "medium" as const })),
});

console.log(JSON.stringify(result, null, 2));
