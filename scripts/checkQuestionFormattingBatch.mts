import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluateQuestionFormatting } from "../shared/questionFormattingGate";

type IncomingQuestion = {
  id?: string | number;
  externalId?: string;
  subject?: string;
  topic?: string | null;
  question?: string;
  questionText?: string;
  options?: unknown;
  explanation?: string | null;
  diagram_url?: string | null;
  diagramUrl?: string | null;
};

const [inputPath, outputPath = "question-formatting-gate-report.json"] = process.argv.slice(2);
if (!inputPath) {
  throw new Error("Usage: pnpm tsx scripts/checkQuestionFormattingBatch.mts <batch.json> [report.json]");
}

const payload = JSON.parse(await readFile(resolve(inputPath), "utf8")) as unknown;
const records = Array.isArray(payload)
  ? payload
  : payload && typeof payload === "object" && Array.isArray((payload as { questions?: unknown[] }).questions)
    ? (payload as { questions: unknown[] }).questions
    : payload && typeof payload === "object" && Array.isArray((payload as { records?: unknown[] }).records)
      ? (payload as { records: unknown[] }).records
      : (() => { throw new Error("Batch JSON must be an array or contain a questions/records array."); })();

const results = records.map((value, index) => {
  const record = (value ?? {}) as IncomingQuestion;
  const options = Array.isArray(record.options) ? record.options.filter((option): option is string => typeof option === "string") : [];
  const result = evaluateQuestionFormatting({
    subject: record.subject ?? "",
    topic: record.topic,
    question: record.question ?? record.questionText ?? "",
    options,
    explanation: record.explanation,
    diagramUrl: record.diagram_url ?? record.diagramUrl,
  });
  return {
    index,
    recordId: String(record.externalId ?? record.id ?? `row-${index + 1}`),
    subject: record.subject ?? "",
    status: result.status,
    reasons: result.reasons,
    hasAsciiExponent: result.hasAsciiExponent,
    hasLegacyEnglishGap: result.hasLegacyEnglishGap,
  };
});

const blocked = results.filter((result) => result.status === "needs_review");
const report = {
  total: results.length,
  ready: results.length - blocked.length,
  needsReview: blocked.length,
  results,
};
await writeFile(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ total: report.total, ready: report.ready, needsReview: report.needsReview, output: resolve(outputPath) }, null, 2));
if (blocked.length) process.exitCode = 2;
