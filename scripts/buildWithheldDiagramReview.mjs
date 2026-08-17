import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const reports = path.join(root, "reports");
const audit = JSON.parse(fs.readFileSync(path.join(reports, "diagram_candidate_audit.json"), "utf8"));
const classification = JSON.parse(fs.readFileSync(path.join(reports, "withheld_diagram_candidate_classification_aug17.json"), "utf8"));
const classified = new Map(classification.classifications.map((row) => [`${row.file}::${row.externalId}`, row]));
const cache = new Map();
function loadRecords(file) {
  if (cache.has(file)) return cache.get(file);
  const parsed = JSON.parse(fs.readFileSync(path.join(reports, file), "utf8"));
  const records = Array.isArray(parsed) ? parsed : (parsed.records ?? parsed.questions ?? []);
  cache.set(file, records);
  return records;
}
function answerLetter(index) { return ["A", "B", "C", "D", "E"][Number(index)] ?? "?"; }
function clean(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
const lines = [
  "# JAMB Quest — Held Diagram-Candidate Review",
  "",
  "> This is a review list, not a release. The 48 records below were held because the original intake audit detected diagram-like wording or a structure/process that could benefit from a visual. A record should only be released after its source/answer gate is satisfied. The two records marked `original figure required` must not receive a guessed replacement.",
  "",
  `**Candidate count:** ${audit.candidateCount}`,
  `**Classification:** ${classification.bySubject.Biology.total} Biology candidates and ${classification.bySubject.Chemistry.total} Chemistry candidates; ${classification.bySubject.Biology.safeOptionalSchematic + classification.bySubject.Chemistry.safeOptionalSchematic} can receive an optional instructional schematic if their source/answer evidence is approved; ${classification.bySubject.Biology.requiresOriginalSourceFigure + classification.bySubject.Chemistry.requiresOriginalSourceFigure} require the original source figure.`,
  "",
  "## How to approve",
  "",
  "Reply with the item IDs you want treated as owner-approved, or send the original source pages for any item that refers to labels, arrows, or an omitted figure. If you approve a safe optional schematic, it will be created as a restrained black-and-white illustration and the question count will increase only if we create a genuinely new model record; attaching a visual to an existing record does not increase the count.",
  "",
];
for (const [index, candidate] of audit.records.entries()) {
  const key = `${candidate.file}::${candidate.externalId}`;
  const row = classified.get(key);
  const record = loadRecords(candidate.file).find((item) => String(item.id ?? item.externalId) === String(candidate.externalId));
  const options = record?.options ?? [record?.optionA, record?.optionB, record?.optionC, record?.optionD, record?.optionE].filter(Boolean);
  const answerIndex = record?.answerIndex ?? record?.answer_index;
  const reason = row?.classification === "requires-original-source-figure" ? "Original source figure required; do not recreate from guesswork." : "Optional black-and-white schematic is possible, subject to source/answer approval.";
  lines.push(`### ${index + 1}. ${candidate.subject} · ${candidate.externalId}`);
  lines.push(`- **Topic:** ${clean(candidate.topic)}`);
  lines.push(`- **Question:** ${clean(candidate.question)}`);
  lines.push(`- **Options:** ${options.length ? options.map((option, optionIndex) => `${answerLetter(optionIndex)}) ${clean(option)}`).join(" · ") : "Options not found in the staged receipt"}`);
  lines.push(`- **Recorded answer:** ${answerIndex === undefined ? "Not found in the staged receipt" : `${answerLetter(answerIndex)} — ${clean(record?.answerText ?? record?.answer_text ?? "")}`}`);
  lines.push(`- **Release requirement:** ${reason}`);
  lines.push(`- **Source receipt:** \`${candidate.file}\``);
  lines.push("");
}
fs.writeFileSync(path.join(reports, "withheld_diagram_question_review_aug17.md"), lines.join("\n") + "\n");
console.log(`Wrote ${audit.records.length} held diagram candidates.`);
