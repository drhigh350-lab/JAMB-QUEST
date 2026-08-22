import { readFile } from "node:fs/promises";
import { authorisedImportSchema } from "../server/questionImport";

const STAGED_PATH = "/home/ubuntu/jamb-import-staging/pdf_owner_uoe_001_to_100_answer_matched_eligible.json";
const SOURCE_LABEL = "Owner PDF answer-matched Use of English 1–100 · 22 Aug 2026";
const staged = JSON.parse(await readFile(STAGED_PATH, "utf8")) as Array<{
  externalId: string;
  subject: "Use of English";
  topic: string;
  difficulty: "medium";
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceLabel: string;
  permissionNote: string;
}>;

if (staged.length !== 99 || new Set(staged.map((record) => record.externalId)).size !== 99) {
  throw new Error("Expected exactly 99 unique, answer-matched Use of English records.");
}
if (staged.some((record) => record.externalId === "PDF-OWNER-20260822-ENG-031" || record.subject !== "Use of English" || record.sourceLabel !== SOURCE_LABEL)) {
  throw new Error("The staged payload includes the contradictory key or an unexpected source/subject.");
}

authorisedImportSchema.parse({
  sourceLabel: SOURCE_LABEL,
  permissionNote: staged[0]?.permissionNote ?? "Missing permission note",
  fileName: "UoE_Batch1_Q1-100.md",
  storageKey: "owner-markdown://UoE_Batch1_Q1-100.md",
  questions: staged.map(({ externalId, subject, topic, difficulty, question, options, answerIndex, explanation }) => ({
    externalId,
    subject,
    topic,
    difficulty,
    question,
    options,
    answerIndex,
    explanation,
  })),
});

console.log(JSON.stringify({ validatedCount: staged.length, sourceLabel: SOURCE_LABEL, heldExternalId: "PDF-OWNER-20260822-ENG-031" }, null, 2));
process.exit(0);
