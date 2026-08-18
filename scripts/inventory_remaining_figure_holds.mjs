import { readFileSync, writeFileSync } from "node:fs";

const safeTextStructureIds = new Set(["960274", "960330", "960476", "1020078"]);
const holds = JSON.parse(readFileSync("reports/missing_diagram_gate_holds_aug18.json", "utf8"));
const remaining = holds
  .filter((row) => !safeTextStructureIds.has(String(row.id)))
  .map((row) => ({
    id: row.id,
    externalId: row.externalId,
    subject: row.subject,
    sourceLabel: row.sourceLabel,
    question: row.question.slice(0, 180),
  }));
const bySource = Object.fromEntries([...new Set(remaining.map((row) => row.sourceLabel))].sort().map((label) => [label, remaining.filter((row) => row.sourceLabel === label).length]));

writeFileSync("reports/remaining_figure_dependent_holds_aug18.json", JSON.stringify({ count: remaining.length, bySource, records: remaining }, null, 2));
console.log(JSON.stringify({ count: remaining.length, bySource }, null, 2));
