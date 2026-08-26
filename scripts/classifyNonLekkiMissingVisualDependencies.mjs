import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const auditPath = path.join(projectRoot, "reports", "non_lekki_external_audit_reproduction_20260826.json");
const reportPath = path.join(projectRoot, "reports", "non_lekki_missing_visual_dependency_classification_20260826.json");
const directVisualAnchor = /(?:\b(?:diagram|figure|illustration|graph|table)\s+(?:above|below|shown|illustrated|given)\b|\b(?:from|use)\s+the\s+(?:diagram|figure|illustration|graph|table)\b|\bpart\s+labelled\s+(?:[A-Z]|[IVXLCDM]+|\d+)\b|\b(?:label|part)\s+(?:[A-Z]|[IVXLCDM]+|\d+)\s+(?:in|on)\s+the\s+(?:diagram|figure|illustration)\b)/i;
const textualStructureEvidence = /(?:\[structure\]|(?:\bCH\d*|\bH\d*C)\s*(?:[-–—=]|\()|C\(=O\)|CH\(OH\))/i;

const audit = JSON.parse(await fs.readFile(auditPath, "utf8"));
const candidates = audit.findings.filter((finding) => finding.issueType === "visual_reference_without_asset_or_existing_hold");
const classifications = candidates.map((candidate) => {
  const text = candidate.preview;
  const direct = directVisualAnchor.test(text) && !textualStructureEvidence.test(text);
  return {
    ...candidate,
    classification: direct ? "direct_answer_critical_visual_dependency" : "ambiguous_or_textual_reference",
    action: direct ? "eligible only with a complete clean exact original; otherwise withhold from learner play" : "retain for individual source review; do not infer a missing visual",
  };
});
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Read-only classification of non-Lekki missing visual references. No eligibility or learner record changes occur in this script.",
  candidateCount: classifications.length,
  directAnswerCriticalCount: classifications.filter((candidate) => candidate.classification === "direct_answer_critical_visual_dependency").length,
  ambiguousOrTextualCount: classifications.filter((candidate) => candidate.classification === "ambiguous_or_textual_reference").length,
  classifications,
};
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, candidateCount: report.candidateCount, directAnswerCriticalCount: report.directAnswerCriticalCount, ambiguousOrTextualCount: report.ambiguousOrTextualCount }, null, 2));
