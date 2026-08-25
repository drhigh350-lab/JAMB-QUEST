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
    expect(reconciliation.learnerFacingLinkedMappings).toEqual({ total: 101, bySubject: { Biology: 50, Chemistry: 26, Physics: 25, "Use of English": 0 } });
    expect(reconciliation.missingOriginalVisualHolds).toMatchObject({ total: 30, bySubject: { Biology: 27, Chemistry: 3 }, learnerState: "excluded by the production eligibility guard; no generated replacement is used" });
    expect(reconciliation.safetyBoundary).toContain("The 42 reviewed screenshot mappings and the 30 remaining missing-original holds are distinct sets; the latter are not learner-visible while their original source figures are unavailable.");
  });

  it("releases biology_0369 only after exact source and protected-field verification", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0369Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0369"');
    expect(script).toContain("biology-0369-schoolngr-source-panel_aa1ec92c.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0386 only after exact source and protected-field verification", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0386Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0386"');
    expect(script).toContain("biology-0386-schoolngr-source-panel_50cbedfb.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("corrects biology_0396 only where the exact source graph proves the malformed option and key mismatch", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0396SourceGraphRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0396"');
    expect(script).toContain("biology-0396-schoolngr-source-panel_658f04ef.png");
    expect(script).toContain('["15 °C","19 °C","24 °C","33 °C"]');
    expect(script).toContain("replacementAnswerIndex: 2");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("corrects biology_0402 only where the exact source urinary-system diagram proves the key and explanation mismatch", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0402SourceDiagramRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0402"');
    expect(script).toContain("biology-0402-schoolngr-source-panel_2f306451.png");
    expect(script).toContain("replacementAnswerIndex: 1");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("repairs the reported biology_1102 beak question only with an exact-source figure, key, and explanation", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology1102SourceBeakRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_1102"');
    expect(script).toContain("biology-1102-myschool-source-panel_41a60dd5.png");
    expect(script).toContain("replacementAnswerIndex: 3");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("releases biology_0405 only through a guarded source-only mapping that leaves protected content untouched", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0405Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0405"');
    expect(script).toContain("biology-0405-schoolngr-source-panel_9fb86380.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("repairs biology_1020 only where exact public sources prove the thoracic key and clean original figure", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology1020SourceVertebraRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_1020"');
    expect(script).toContain("biology-1020-quizzerweb-original_595264ba.webp");
    expect(script).toContain("replacementAnswerIndex: 1");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("releases biology_0518 only through a guarded exact-original graph mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0518Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0518"');
    expect(script).toContain("biology-0518-myschool-original_32575fb8.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0600 only through a guarded exact-original apparatus mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0600Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0600"');
    expect(script).toContain("biology-0600-schoolngr-original_413d60ab.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0645 only through a guarded exact-original graph mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0645Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0645"');
    expect(script).toContain("biology-0645-myschool-original_3340a9ed.jpg");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0649 only through a guarded exact-original reproductive-system mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0649Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0649"');
    expect(script).toContain("biology-0649-myschool-original_0ce93479.jpg");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0667 only through a guarded byte-identical original mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0667Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0667"');
    expect(script).toContain("biology-0649-myschool-original_0ce93479.jpg");
    expect(script).toContain("byte-identical");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0870 only through a guarded exact-original thermoregulation graph mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0870Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0870"');
    expect(script).toContain("biology-0870-myschool-original_c780fc2d.jpeg");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });
});
