import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { questionItems, questionSources } from "../drizzle/schema";
import { formatLearnerText } from "../client/src/game/learnerText";
import { getDb } from "../server/db";

type LearnerField = { source: "model" | "authorised"; id: string; subject: string; field: string; value: string };

const reportPath = resolve("reports/full_learner_text_verification.json");
const modelAssetPath = "/home/ubuntu/webdev-static-assets/jamb_high_yield_practice_bank_1000_explanations_batches2_3_v1.json";
const sourceMarkup = /\\[A-Za-z]+|\^\{?\\|_\{?\\|\$[^$]*(?:\\[A-Za-z]+|[{}^_])[^$]*\$|(?:&nbsp;|&amp;|&lt;|&gt;)|\uFFFD/;
const unresolvedMarkup = /\\[A-Za-z]+|\^\{?\\|_\{?\\|\$[^$]*(?:\\[A-Za-z]+|[{}^_])[^$]*\$|(?:&nbsp;|&amp;|&lt;|&gt;)|\uFFFD/;

function fieldsFromRecord(source: LearnerField["source"], id: string, subject: string, question: string, options: string[], explanation?: string | null, context?: string | null): LearnerField[] {
  const fields: LearnerField[] = [
    { source, id, subject, field: "question", value: question },
    ...options.map((value, index) => ({ source, id, subject, field: `option_${index + 1}`, value })),
  ];
  if (context) fields.push({ source, id, subject, field: "context", value: context });
  if (explanation) fields.push({ source, id, subject, field: "explanation", value: explanation });
  return fields;
}

function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === "string") : [];
  } catch {
    return [];
  }
}

const modelPayload = JSON.parse(await readFile(modelAssetPath, "utf8")) as { questions: Array<Record<string, unknown>> };
const modelFields = modelPayload.questions.flatMap((question) => fieldsFromRecord(
  "model",
  String(question.id),
  String(question.subject),
  String(question.question ?? ""),
  Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : [],
  typeof question.explanation === "string" ? question.explanation : null,
  typeof question.context === "string" ? question.context : null,
));

const db = await getDb();
if (!db) throw new Error("Database connection is unavailable for authorised-bank learner-text verification.");
const authorisedRows = await db.select({
  id: questionItems.id,
  externalId: questionItems.externalId,
  subject: questionItems.subject,
  questionText: questionItems.questionText,
  optionsJson: questionItems.optionsJson,
  explanation: questionItems.explanation,
}).from(questionItems).innerJoin(questionSources, eq(questionItems.sourceId, questionSources.id)).where(eq(questionSources.isActive, 1));
const authorisedFields = authorisedRows.flatMap((row) => fieldsFromRecord(
  "authorised",
  row.externalId || String(row.id),
  row.subject,
  row.questionText,
  parseOptions(row.optionsJson),
  row.explanation,
));

const fields = [...modelFields, ...authorisedFields];
const rawMarkup = fields.filter((field) => sourceMarkup.test(field.value));
const unresolved = rawMarkup.map((field) => ({ ...field, rendered: formatLearnerText(field.value) })).filter((field) => unresolvedMarkup.test(field.rendered));
const rawCommandCounts = rawMarkup.flatMap((field) => field.value.match(/\\[A-Za-z]+/g) ?? []).reduce<Record<string, number>>((counts, command) => ({
  ...counts,
  [command]: (counts[command] ?? 0) + 1,
}), {});
const report = {
  totalFields: fields.length,
  totalRecords: modelPayload.questions.length + authorisedRows.length,
  sourceRawMarkupFields: rawMarkup.length,
  renderedUnresolvedFields: unresolved.length,
  rawBySource: rawMarkup.reduce<Record<string, number>>((counts, field) => ({ ...counts, [field.source]: (counts[field.source] ?? 0) + 1 }), {}),
  rawBySubject: rawMarkup.reduce<Record<string, number>>((counts, field) => ({ ...counts, [field.subject]: (counts[field.subject] ?? 0) + 1 }), {}),
  rawCommandCounts: Object.fromEntries(Object.entries(rawCommandCounts).sort(([left], [right]) => left.localeCompare(right))),
  unresolvedSamples: unresolved.slice(0, 50),
  rawSamples: rawMarkup.slice(0, 50),
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
process.exit(unresolved.length ? 1 : 0);
