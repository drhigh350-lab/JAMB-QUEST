import { readFile, writeFile } from "node:fs/promises";

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "explanation-quality-report.json";
if (!inputPath) throw new Error("Usage: node scripts/auditExplanationQuality.mjs <question-bank-or-array.json> [report.json]");

const payload = JSON.parse(await readFile(inputPath, "utf8"));
const records = Array.isArray(payload) ? payload : payload.questions;
if (!Array.isArray(records)) throw new Error("Expected an array or a question-bank payload with a questions array");
const bannedPhrases = ["verification pending", "this question tests your understanding", "revisit", "before moving to the next question", "read the key wording"];
const sentences = (text) => String(text ?? "").split(/\r?\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
const audit = (record) => {
  const explanation = String(record.explanation ?? "");
  const lines = sentences(explanation);
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const joined = explanation.toLowerCase();
  const generic = bannedPhrases.find((phrase) => joined.includes(phrase)) ?? null;
  const enoughStructure = lines.length >= 6 && wordCount >= 75;
  return {
    id: record.id ?? record.externalId ?? "unknown",
    subject: record.subject ?? "unknown",
    topic: record.topic ?? "Uncategorised",
    wordCount,
    sentenceOrLineCount: lines.length,
    status: enoughStructure && !generic ? "approved" : "needs_review",
    reason: generic ? `generic-or-placeholder phrase: ${generic}` : enoughStructure ? null : "requires at least six sentences or lines and 75 words",
  };
};
const results = records.map(audit);
const approved = results.filter((result) => result.status === "approved");
const needsReview = results.filter((result) => result.status === "needs_review");
const report = { inputPath, total: results.length, approved: approved.length, needsReview: needsReview.length, samples: { approved: approved.slice(0, 5), needsReview: needsReview.slice(0, 10) } };
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
