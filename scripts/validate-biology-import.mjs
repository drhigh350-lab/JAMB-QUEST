/* Field Notes Arcade: stage user-provided question sets transparently before any authorised-bank import. */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const inputPath = "/home/ubuntu/upload/Biology_NonDiagram_Questions-1.md";
const outputPath = "/home/ubuntu/jamb-import-staging/biology_owner_provided_pending_review.json";
const reportPath = "/home/ubuntu/jamb-import-staging/biology_owner_provided_validation_report.json";
const sourceText = await readFile(inputPath, "utf8");
const lines = sourceText.split(/\r?\n/);
const modulePattern = /^## Module\s+(\d+)\s*$/i;
const questionPattern = /^\*\*(\d+)\.\s+(.+?)\*\*\s*$/;
const optionPattern = /^- ([A-D])\.\s+(.+)\s*$/;
const answerPattern = /^> \*\*Answer: ([A-D])\*\*\s*—\s*(.+)\s*$/;
const explanationPattern = /^> \*(.+)\*\s*$/;

const staged = [];
const rejected = [];
let moduleNumber = 0;

for (let index = 0; index < lines.length; index += 1) {
  const moduleMatch = lines[index].match(modulePattern);
  if (moduleMatch) {
    moduleNumber = Number(moduleMatch[1]);
    continue;
  }

  const questionMatch = lines[index].match(questionPattern);
  if (!questionMatch) continue;

  const originalNumber = Number(questionMatch[1]);
  const question = questionMatch[2].trim();
  const options = [];
  let answerLetter = null;
  let explanation = "";
  let cursor = index + 1;

  while (cursor < lines.length && !lines[cursor].match(questionPattern) && !lines[cursor].match(modulePattern)) {
    const optionMatch = lines[cursor].match(optionPattern);
    const answerMatch = lines[cursor].match(answerPattern);
    const explanationMatch = lines[cursor].match(explanationPattern);
    if (optionMatch) options.push({ letter: optionMatch[1], text: optionMatch[2].trim() });
    if (answerMatch) answerLetter = answerMatch[1];
    if (explanationMatch) explanation = explanationMatch[1].trim();
    cursor += 1;
  }

  const answerIndex = answerLetter ? options.findIndex((option) => option.letter === answerLetter) : -1;
  const externalId = `BIO-OWNER-M${moduleNumber || "X"}-Q${originalNumber}`;
  const issue = !moduleNumber ? "No module heading" : options.length !== 4 ? `Expected four options; found ${options.length}` : answerIndex < 0 ? "Missing or unmatched answer marker" : "";

  if (issue) {
    rejected.push({ externalId, module: moduleNumber || null, originalNumber, issue, question });
    index = cursor - 1;
    continue;
  }

  staged.push({
    externalId,
    subject: "Biology",
    topic: "General Biology",
    difficulty: "medium",
    question,
    options: options.map((option) => option.text),
    answerIndex,
    explanation: explanation || undefined,
    sourceLabel: "Owner-provided Biology non-diagram collection — pending provenance review",
    permissionNote: "Owner-provided source. The source header identifies a DailyEd likely-UTME ebook; JAMB past-question provenance and permission should be confirmed before a public release.",
    sourceReference: { module: moduleNumber, originalNumber },
  });
  index = cursor - 1;
}

const seen = new Set();
const duplicateIds = staged.filter((question) => {
  if (seen.has(question.externalId)) return true;
  seen.add(question.externalId);
  return false;
}).map((question) => question.externalId);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(staged, null, 2));
await writeFile(reportPath, JSON.stringify({
  inputPath,
  sourceClaim: "The file header says it was extracted from a DailyEd 500+ Likely UTME Biology ebook, not an official JAMB source.",
  stagedQuestionCount: staged.length,
  rejectedQuestionCount: rejected.length,
  duplicateExternalIds: duplicateIds,
  rejected: rejected.slice(0, 50),
  outputPath,
  recommendation: "Keep the set separate from model questions and do not present it as official JAMB past-paper wording unless provenance and permission are independently confirmed.",
}, null, 2));

console.log(JSON.stringify({ staged: staged.length, rejected: rejected.length, duplicateIds: duplicateIds.length, outputPath, reportPath }, null, 2));
