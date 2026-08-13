import { readFile, writeFile } from "node:fs/promises";

const inputPaths = process.argv.slice(2);
if (!inputPaths.length) throw new Error("Usage: node scripts/classifyRichMarkdownBatch.mjs <validated-json> [...more-json]");

const caveatMarkers = [
  "⚠", "flagged", "strictly speaking", "consider swapping", "worth a footnote", "double-check", "two nearly-identical", "doesn't by itself prove", "isn't an exact match", "not a clean distractor", "technically be",
];
const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const ready = [];
const held = [];
const seen = new Set();

for (const inputPath of inputPaths) {
  const records = JSON.parse(await readFile(inputPath, "utf8"));
  if (!Array.isArray(records)) throw new Error(`Expected an array in ${inputPath}`);
  for (const record of records) {
    const reasons = [];
    const explanation = String(record.explanation ?? "").trim();
    const wordCount = explanation.split(/\s+/).filter(Boolean).length;
    const sentenceCount = explanation.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean).length;
    const fingerprint = `${record.subject}:${normalise(String(record.question ?? ""))}`;
    if (!record.question?.trim()) reasons.push("missing question text");
    if (!Array.isArray(record.options) || record.options.length !== 4 || record.options.some((option) => !String(option).trim())) reasons.push("requires exactly four non-empty options");
    if (!Number.isInteger(record.answerIndex) || record.answerIndex < 0 || record.answerIndex > 3) reasons.push("answer index is outside the four options");
    if (wordCount < 65 || sentenceCount < 2) reasons.push("rich explanation requires at least 65 words across two sentences");
    const caveat = caveatMarkers.find((marker) => `${record.question}\n${explanation}`.toLowerCase().includes(marker));
    if (caveat) reasons.push(`source flags an ambiguity: ${caveat}`);
    if (seen.has(fingerprint)) reasons.push("duplicate question across submitted parts");
    if (!reasons.length) seen.add(fingerprint);
    const assessed = { ...record, qualityAssessment: { wordCount, sentenceCount, status: reasons.length ? "held" : "ready", reasons } };
    (reasons.length ? held : ready).push(assessed);
  }
}

const outputDir = "/home/ubuntu/jamb-import-staging";
const report = {
  inputFiles: inputPaths,
  total: ready.length + held.length,
  ready: ready.length,
  held: held.length,
  subjects: Object.fromEntries([...new Set([...ready, ...held].map((record) => record.subject))].map((subject) => [subject, { ready: ready.filter((record) => record.subject === subject).length, held: held.filter((record) => record.subject === subject).length }])),
  heldSamples: held.slice(0, 30).map((record) => ({ externalId: record.externalId, subject: record.subject, question: record.question, reasons: record.qualityAssessment.reasons })),
};
await writeFile(`${outputDir}/submitted_rich_questions.ready.json`, `${JSON.stringify(ready, null, 2)}\n`);
await writeFile(`${outputDir}/submitted_rich_questions.held.json`, `${JSON.stringify(held, null, 2)}\n`);
await writeFile(`${outputDir}/submitted_rich_questions.classification-report.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
