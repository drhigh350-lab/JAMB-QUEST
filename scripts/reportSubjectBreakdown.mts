import { readFile, writeFile } from "node:fs/promises";
import { getPlayableAuthorisedQuestions } from "/home/ubuntu/jamb-quiz-game/server/db";
const authorised = await getPlayableAuthorisedQuestions();
const model = JSON.parse(await readFile("/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json", "utf8")) as { questions?: Array<{ subject?: string }> };
const modelRows = (model.questions ?? []).filter((row): row is { subject: string } => typeof row.subject === "string");
const subjects = ["Use of English", "Biology", "Chemistry", "Physics"] as const;
const bySubject = Object.fromEntries(subjects.map(subject => {
  const authorisedCount = authorised.filter(row => row.subject === subject).length;
  const modelCount = modelRows.filter(row => row.subject === subject).length;
  return [subject, { authorisedPlayable: authorisedCount, modelPlayable: modelCount, learnerFacing: authorisedCount + modelCount }];
}));
const report = { authorisedPlayable: authorised.length, modelPlayable: modelRows.length, learnerFacingTotal: authorised.length + modelRows.length, bySubject, generatedAt: new Date().toISOString() };
await writeFile("/home/ubuntu/jamb-quiz-game/reports/subject_breakdown_aug17.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
