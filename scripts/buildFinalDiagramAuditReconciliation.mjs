import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = "/home/ubuntu/jamb-quiz-game";
const decisionsPath = path.join(projectRoot, "reports", "learner_source_screenshot_decisions_20260825.json");
const holdsPath = path.join(projectRoot, "reports", "explicit_diagram_asset_holds_20260825.json");
const outputPath = path.join(projectRoot, "reports", "learner_diagram_audit_reconciliation_20260825.json");

const [decisions, holds] = await Promise.all([
  fs.readFile(decisionsPath, "utf8").then(JSON.parse),
  fs.readFile(holdsPath, "utf8").then(JSON.parse),
]);

const currentLinkedMappings = {
  Biology: 54,
  Chemistry: 28,
  Physics: 25,
  "Use of English": 0,
};

const output = {
  generatedAt: new Date().toISOString(),
  scope: "Final source-preserving learner diagram reconciliation. Counts reflect the post-repair database reconciliation; all material with a required missing original visual remains excluded from the learner pool.",
  learnerFacingLinkedMappings: {
    total: Object.values(currentLinkedMappings).reduce((sum, count) => sum + count, 0),
    bySubject: currentLinkedMappings,
  },
  sourceScreenshotReview: {
    reviewed: decisions.totals.reviewedSourceScreenshotMappings,
    retainedOriginal: decisions.totals.retainedSourceOriginal,
    repairedWithSourceOnlyOriginalCrop: decisions.totals.sourceOnlyCropsMapped,
    heldWithinReviewedScreenshotSet: decisions.totals.held,
    repairedExternalIds: decisions.decisions.filter((decision) => decision.changedMapping).map((decision) => decision.externalId),
  },
  sourceBackedMappingRepairs: {
    redundantChemistryMappingsRemoved: [
      "OWNER-CHEM-DIAGRAM-2026-005",
      "OWNER-CHEM-DIAGRAM-2026-006",
      "OWNER-CHEM-DIAGRAM-2026-007",
    ],
    recoveredChemistryFormulaTableReleased: "OWNER-CHEM-DIAGRAM-2026-009",
    recoveredPhysicsOriginalPanelsReleased: decisions.decisions.filter((decision) => decision.changedMapping).map((decision) => decision.externalId),
  },
  missingOriginalVisualHolds: {
    total: holds.totalHeld,
    bySubject: holds.bySubject,
    learnerState: "excluded by the production eligibility guard; no generated replacement is used",
    sourceSlugs: [...new Set(holds.holds.map((hold) => hold.sourceSlug))],
  },
  safetyBoundary: [
    "Mapping-only releases preserve question stem, options, answer index, topic, explanation, and source relationship; any source-proven content repair is guarded and separately receipted.",
    "No AI-generated or semantically reconstructed diagram was released.",
    "The 42 reviewed screenshot mappings and the 24 remaining missing-original holds are distinct sets; the latter are not learner-visible while their original source figures are unavailable.",
  ],
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, learnerFacingLinkedMappings: output.learnerFacingLinkedMappings, missingOriginalVisualHolds: output.missingOriginalVisualHolds }, null, 2));
