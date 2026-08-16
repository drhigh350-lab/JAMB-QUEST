import { readFile, writeFile } from "node:fs/promises";
import { getPlayableAuthorisedQuestions } from "../server/db";

const modelPath = "/home/ubuntu/jamb-import-staging/model_bank_for_duplicate_audit.json";
const reportPath = "/home/ubuntu/jamb-quiz-game/reports/final_csv_runtime_count_aug16.json";
const authorised = await getPlayableAuthorisedQuestions();
const model = JSON.parse(await readFile(modelPath, "utf8")) as { questions?: unknown[] };
const bySource = authorised.reduce<Record<string, number>>((counts, record) => {
  counts[record.sourceLabel] = (counts[record.sourceLabel] ?? 0) + 1;
  return counts;
}, {});
const report = {
  authorisedPlayable: authorised.length,
  modelPlayable: model.questions?.length ?? 0,
  learnerFacingTotal: authorised.length + (model.questions?.length ?? 0),
  finalCsvPlayable: Object.fromEntries(Object.entries(bySource).filter(([label]) => label.startsWith("Kairo · user-supplied final CSV"))),
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
