import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("undersized diagram audit repair", () => {
  it("removes only redundant crops and holds the incomplete source table without touching protected question fields", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairUndersizedChemistryDiagramMappings.mjs"), "utf8");
    expect(script).toContain("OWNER-CHEM-DIAGRAM-2026-005");
    expect(script).toContain("OWNER-CHEM-DIAGRAM-2026-006");
    expect(script).toContain("OWNER-CHEM-DIAGRAM-2026-007");
    expect(script).toContain("OWNER-CHEM-DIAGRAM-2026-009");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = NULL");
    expect(script).toContain("UPDATE questionItems SET explanationStatus = 'needs_review'");
    expect(script).toContain("protected source mismatch");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases the held formula table only after a verified source-only crop is available", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredChemistryFormulaTable.mjs"), "utf8");
    expect(script).toContain("OWNER-CHEM-DIAGRAM-2026-009");
    expect(script).toContain("owner-chem-diagram-2026-009-source-table_b66e3aaa.png");
    expect(script).toContain("explanationStatus = 'approved'");
    expect(script).toContain("explanationStatus = 'needs_review'");
    expect(script).toContain("protected source mismatch");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("replaces only the four verified incomplete Physics panels and preserves every protected question field", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairIncompletePhysicsDiagramMappings.mjs"), "utf8");
    const recovery = readFileSync(resolve(import.meta.dirname, "../scripts/recoverIncompletePhysicsDiagramPanels.py"), "utf8");
    for (const id of ["003", "005", "007", "008"]) {
      expect(script).toContain(`OWNER-PHY-DIAGRAM-2026-${id}`);
      expect(recovery).toContain(`OWNER-PHY-DIAGRAM-2026-${id}`);
    }
    expect(script).toContain("SET diagramUrl = ?");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("sourceId");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("records a final disposition for each of the 42 retained source screenshots", () => {
    const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, "../reports/learner_source_screenshot_decisions_20260825.json"), "utf8"));
    expect(manifest.totals).toEqual({ reviewedSourceScreenshotMappings: 42, retainedSourceOriginal: 38, sourceOnlyCropsMapped: 4, held: 0 });
    expect(manifest.decisions).toHaveLength(42);
    expect(manifest.decisions.filter((decision: { disposition: string }) => decision.disposition === "crop_and_retain").map((decision: { externalId: string }) => decision.externalId).sort())
      .toEqual(["OWNER-PHY-DIAGRAM-2026-003", "OWNER-PHY-DIAGRAM-2026-005", "OWNER-PHY-DIAGRAM-2026-007", "OWNER-PHY-DIAGRAM-2026-008"]);
    expect(manifest.decisions.every((decision: { noSemanticRedraw: boolean; noAnswerOptionOrCorrectionInDiagram: boolean }) => decision.noSemanticRedraw && decision.noAnswerOptionOrCorrectionInDiagram)).toBe(true);
  });

  it("keeps diagram-required records without an original source asset out of learner play without mutating their content", () => {
    const audit = readFileSync(resolve(import.meta.dirname, "../scripts/auditExplicitDiagramAssetHolds.mjs"), "utf8");
    const reconciliation = JSON.parse(readFileSync(resolve(import.meta.dirname, "../reports/learner_diagram_audit_reconciliation_20260825.json"), "utf8"));
    expect(audit).toContain("hold_missing_original");
    expect(audit).toContain("toPlayableAuthorisedQuestion");
    expect(audit).toContain("SELECT qi.id");
    expect(audit).not.toContain("UPDATE questionItems");
    expect(reconciliation.learnerFacingLinkedMappings).toEqual({ total: 88, bySubject: { Biology: 37, Chemistry: 26, Physics: 25, "Use of English": 0 } });
    expect(reconciliation.missingOriginalVisualHolds).toMatchObject({ total: 42, bySubject: { Biology: 39, Chemistry: 3 }, learnerState: "excluded by the production eligibility guard; no generated replacement is used" });
    expect(reconciliation.safetyBoundary).toContain("The 42 reviewed screenshot mappings and the 42 missing-original holds are distinct sets; the latter are not learner-visible while their original source figures are unavailable.");
  });
});
