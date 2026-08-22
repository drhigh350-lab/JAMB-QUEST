import { readFile, writeFile } from "node:fs/promises";
import { formatLearnerText } from "../client/src/game/learnerText";

const INPUT_PATH = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_7_plus_batch9_model_v3_rectified.json";
const REPORT_PATH = "/home/ubuntu/jamb-quiz-game/reports/model_bank_physics_learner_format_audit.json";

type ModelQuestion = { id: string; subject: string; question?: string; options?: unknown; explanation?: string };
type FieldChange = { id: string; field: string; before: string; rendered: string };

const payload = JSON.parse(await readFile(INPUT_PATH, "utf8")) as { questions: ModelQuestion[] };
const physics = payload.questions.filter((question) => question.subject === "Physics");
const renderChanges: FieldChange[] = [];
const unresolved: FieldChange[] = [];
for (const question of physics) {
  const fields: Array<[string, string]> = [
    ["question", question.question ?? ""],
    ...(Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string").map((option, index): [string, string] => [`option_${index + 1}`, option]) : []),
    ["explanation", question.explanation ?? ""],
  ];
  for (const [field, value] of fields) {
    const rendered = formatLearnerText(value);
    if (rendered !== value) renderChanges.push({ id: question.id, field, before: value, rendered });
    if (/\\[A-Za-z]+|\^\{?[^0-9+\-}]|_\{?[^0-9+\-}]|\uFFFD|[{}]/.test(rendered)) unresolved.push({ id: question.id, field, before: value, rendered });
  }
}
const report = {
  physicsModelRecords: physics.length,
  fieldsImprovedAtRender: renderChanges.length,
  recordsImprovedAtRender: new Set(renderChanges.map((change) => change.id)).size,
  unresolvedLearnerFormattingFields: unresolved.length,
  unresolvedLearnerFormattingRecords: new Set(unresolved.map((change) => change.id)).size,
  renderChanges,
  unresolved,
};
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ physicsModelRecords: report.physicsModelRecords, fieldsImprovedAtRender: report.fieldsImprovedAtRender, recordsImprovedAtRender: report.recordsImprovedAtRender, unresolvedLearnerFormattingRecords: report.unresolvedLearnerFormattingRecords, reportPath: REPORT_PATH }, null, 2));
