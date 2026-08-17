import { readFileSync } from "node:fs";
import { getUserByOpenId, importAuthorisedQuestionSet } from "../server/db";
import { ENV } from "../server/_core/env";

type StagedQuestion = {
  externalId: string;
  subject: "Biology";
  year: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  topic: string;
  diagramUrl: string;
};

type StagedFile = { questions: StagedQuestion[] };

const staged = JSON.parse(readFileSync("reports/biology_diagram_questions_aug17.json", "utf8")) as StagedFile;
const owner = await getUserByOpenId(ENV.ownerOpenId);
if (!owner) throw new Error("Owner account was not found for controlled import");

const result = await importAuthorisedQuestionSet(owner.id, {
  sourceLabel: "Owner-supplied Biology 2025 diagram questions · verified key and explanation",
  permissionNote: "Owner supplied the reference screenshots, answer key, and explanations for use in JAMB Quest.",
  fileName: "biology-2025-diagram-questions-owner-supplied.json",
  storageKey: "owner-supplied/biology-2025-diagram-questions-owner-supplied.json",
  questions: staged.questions.map((question) => ({
    externalId: question.externalId,
    subject: question.subject,
    topic: question.topic,
    difficulty: "medium" as const,
    question: question.question,
    options: question.options,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
    diagramUrl: question.diagramUrl,
  })),
});

console.log(JSON.stringify(result, null, 2));
