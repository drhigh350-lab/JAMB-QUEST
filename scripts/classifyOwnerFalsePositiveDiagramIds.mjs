import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const inputPath = path.join(projectRoot, "reports", "owner_false_positive_diagram_ids_inspection_20260826.json");
const outputPath = path.join(projectRoot, "reports", "owner_false_positive_diagram_ids_classification_20260826.json");
const DIAGRAM_REFERENCE = /(?:\[(?:diagram|refers to .*diagram)\b|diagram\s+(?:above|below|shown|illustrated)|illustration\s+(?:above|below|shown)|figure\s+(?:above|below|shown)|\b(?:use|from)\s+the\s+diagram\b|\b(?:structure|compound|graph)\s+above\b|\bgraph\s+shown\b|\brate\s+of\s+reaction\s+diagram\b|\bbeak\s+structure\s+of\s+the\s+organism\b|\bin\s+the\s+(?:above\s+)?(?:diagram|figure|illustration)\s*,?\s+the\s+part\s+labelled\b|\bthe\s+part\s+labelled\s+(?:[a-z]|[ivxlcdm]+|\d+)\s+(?:in|on)\s+the\s+(?:above\s+)?(?:diagram|figure|illustration)\b|\buse\s+the\s+table\s+to\s+answer\b)/i;
const TEXTUAL_STRUCTURE_EVIDENCE = /(?:\[structure\]|(?:\bCH\d*|\bH\d*C)\s*(?:[-–—=]|\()|C\(=O\)|CH\(OH\))/i;
const requiresDiagramAsset = (questionText) => DIAGRAM_REFERENCE.test(questionText) && !TEXTUAL_STRUCTURE_EVIDENCE.test(questionText);

const input = JSON.parse(await fs.readFile(inputPath, "utf8"));
const records = input.records.map((record) => {
  const visualRequiredByRuntime = requiresDiagramAsset(record.questionText);
  let disposition;
  if (record.sourceActive !== 1) disposition = "leave_unchanged_source_inactive";
  else if (record.explanationStatus !== "approved") disposition = "hold_for_non_visual_quality_review";
  else if (visualRequiredByRuntime && !record.diagramUrl) disposition = "hold_for_real_visual";
  else disposition = "already_text_playable";
  return { ...record, visualRequiredByRuntime, disposition };
});
const counts = records.reduce((result, record) => {
  result[record.disposition] = (result[record.disposition] ?? 0) + 1;
  return result;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  mode: "Read-only classification. No database record or learner eligibility rule was changed.",
  safetyRule: "A question is classified as already text-playable only when its active stored record is approved and the exact learner visual-dependency matcher does not require an asset.",
  summary: { requested: records.length, counts },
  records,
};
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, summary: report.summary, records: records.map((record) => ({ requestedId: record.requestedId, id: record.id, disposition: record.disposition, visualRequiredByRuntime: record.visualRequiredByRuntime, explanationStatus: record.explanationStatus, sourceActive: record.sourceActive })) }, null, 2));
