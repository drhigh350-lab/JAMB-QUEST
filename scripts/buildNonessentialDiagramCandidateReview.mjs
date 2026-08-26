import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const sourcePath = path.join(projectRoot, "reports", "nonessential_diagram_link_audit_20260826.json");
const outputPath = path.join(projectRoot, "reports", "nonessential_diagram_candidate_review_20260826.md");
const audit = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const candidates = audit.records.filter((record) => record.disposition === "candidate_remove_nonessential_link");
const escapeCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const lines = [
  "# Candidate non-essential diagram link review",
  "",
  "This is a read-only review list. Each row has no direct or implicit visual anchor under the conservative audit rule; it still needs a guarded mapping-only receipt before a link can be removed.",
  "",
  "| ID | Subject | Review status | Question | Saved answer | Current link |",
  "|---:|---|---|---|---|---|",
  ...candidates.map((record) => `| ${record.id} | ${escapeCell(record.subject)} | ${escapeCell(record.explanationStatus)} | ${escapeCell(record.questionText)} | ${escapeCell(record.options[record.answerIndex])} | ${escapeCell(record.diagramUrl)} |`),
  "",
  `Total: ${candidates.length} candidate links. No data was changed to create this review.`,
  "",
];
await fs.writeFile(outputPath, lines.join("\n"));
console.log(JSON.stringify({ outputPath, candidateCount: candidates.length }, null, 2));
