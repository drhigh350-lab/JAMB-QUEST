import { readFileSync, writeFileSync } from "node:fs";

const sources = [
  { path: "reports/physics_diagram_questions_aug17.json", label: "Physics screenshot batch" },
  { path: "reports/chemistry_diagram_questions_aug17.json", label: "Chemistry screenshot batch" },
  { path: "reports/biology_diagram_questions_aug17.json", label: "Biology screenshot batch" },
  { path: "reports/final_biology_diagram_questions_aug17.json", label: "Final Biology screenshot batch" },
];

const rows = sources.flatMap(({ path, label }) => {
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  return manifest.questions.map((question) => ({
    batch: label,
    externalId: question.externalId,
    subject: question.subject,
    sourceVisual: question.sourceScreenshot ?? "Original owner screenshot from this batch (filename was not retained in the manifest)",
    stem: question.question,
  }));
});

rows.push(
  {
    batch: "Separate defective reconstruction",
    externalId: "kairo-csv-chemistry_20650b (record 1050122)",
    subject: "Chemistry",
    sourceVisual: "Owner-original energy-profile visual required",
    stem: "In the energy profile diagram above, X represents the:",
  },
  {
    batch: "Separate defective reconstruction",
    externalId: "kairo-csv-chemistry_30bd42 (record 1050171)",
    subject: "Chemistry",
    sourceVisual: "Owner-original organic structural-formula visual required",
    stem: "The IUPAC nomenclature for the compound above is:",
  },
);

const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const body = rows.map((row, index) => `| ${index + 1} | ${escapeCell(row.batch)} | ${escapeCell(row.subject)} | \`${escapeCell(row.externalId)}\` | ${escapeCell(row.sourceVisual)} | ${escapeCell(row.stem)} |`).join("\n");

const report = `# Owner Original Visual Relinking List\n\n> All records below are intentionally held out of JAMB Quest learner play. They must be linked only to an owner-supplied original image or diagram; no generated substitute is permitted.\n\n| # | Held batch | Subject | Stable record ID | Original visual to supply | Question stem |\n| ---: | --- | --- | --- | --- | --- |\n${body}\n\n## Relinking rule\n\nFor each future visual, retain the stable record ID above and provide the original image in PNG, JPG, or a clean exported PDF page. The question will be returned to review first; it will be released only after the original visual displays accurately on a phone screen and contains no answer-leaking annotation.\n`;

writeFileSync("reports/owner_original_visual_relink_list_aug18.md", report);
console.log(`Wrote ${rows.length} held records to reports/owner_original_visual_relink_list_aug18.md`);
