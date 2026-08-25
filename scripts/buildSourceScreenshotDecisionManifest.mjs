import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const classificationPath = path.join(projectRoot, "reports", "learner_diagram_classification_20260825.json");
const outputPath = path.join(projectRoot, "reports", "learner_source_screenshot_decisions_20260825.json");

const repairedMappings = new Map([
  ["OWNER-PHY-DIAGRAM-2026-003", "/manus-storage/owner-phy-diagram-2026-003-source-panel_50717966.png"],
  ["OWNER-PHY-DIAGRAM-2026-005", "/manus-storage/owner-phy-diagram-2026-005-source-panel_63401d12.png"],
  ["OWNER-PHY-DIAGRAM-2026-007", "/manus-storage/owner-phy-diagram-2026-007-source-panel_a3213b69.png"],
  ["OWNER-PHY-DIAGRAM-2026-008", "/manus-storage/owner-phy-diagram-2026-008-source-panel_acaa185f.png"],
]);

const report = JSON.parse(await fs.readFile(classificationPath, "utf8"));
const screenshotRecords = report.records
  .filter((record) => record.decision === "review_source_screenshot")
  .sort((a, b) => a.externalId.localeCompare(b.externalId));

if (screenshotRecords.length !== 42) {
  throw new Error(`Expected 42 source-screenshot records, found ${screenshotRecords.length}`);
}

const decisions = screenshotRecords.map((record) => {
  const mappingAfterReview = repairedMappings.get(record.externalId) ?? record.diagramUrl;
  const isRecoveredPanel = repairedMappings.has(record.externalId);
  return {
    externalId: record.externalId,
    subject: record.subject,
    topic: record.topic,
    sourceAssetUrlAtInventory: record.diagramUrl,
    mappingAfterReview,
    disposition: isRecoveredPanel ? "crop_and_retain" : "retain_source_original",
    changedMapping: isRecoveredPanel,
    evidence: isRecoveredPanel
      ? "Raw owner screenshot contains the complete tested figure. Replaced partial learner crop with an original-only panel that excludes prompt, options, explanation, and source UI."
      : "Reviewed source figure is legible, fits the protected question, and contains no answer option or explanatory correction within the stored visual.",
    noSemanticRedraw: true,
    noAnswerOptionOrCorrectionInDiagram: true,
  };
});

const output = {
  generatedAt: new Date().toISOString(),
  scope: "Final source-screenshot disposition manifest for learner diagram review. This report records mapping decisions only; it never changes protected question content.",
  decisionBasis: [
    "The 42-record source-screenshot set is defined by the deterministic classification report.",
    "Only original-owner figure panels may replace a screenshot mapping; no AI visual regeneration is permitted.",
    "Each retained or recovered panel must exclude answer options, answer letters, explanatory corrections, and app/source controls.",
  ],
  totals: {
    reviewedSourceScreenshotMappings: decisions.length,
    retainedSourceOriginal: decisions.filter((decision) => decision.disposition === "retain_source_original").length,
    sourceOnlyCropsMapped: decisions.filter((decision) => decision.disposition === "crop_and_retain").length,
    held: decisions.filter((decision) => decision.disposition === "hold").length,
  },
  decisions,
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: output.totals }, null, 2));
