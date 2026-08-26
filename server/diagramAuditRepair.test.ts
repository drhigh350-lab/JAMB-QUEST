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
    expect(reconciliation.learnerFacingLinkedMappings).toEqual({ total: 121, bySubject: { Biology: 68, Chemistry: 28, Physics: 25, "Use of English": 0 } });
    expect(reconciliation.missingOriginalVisualHolds).toMatchObject({ total: 10, bySubject: { Biology: 9, Chemistry: 1 }, learnerState: "excluded by the production eligibility guard; no generated replacement is used" });
    expect(reconciliation.safetyBoundary).toContain("The 42 reviewed screenshot mappings and the 10 remaining missing-original holds are distinct sets; the latter are not learner-visible while their original source figures are unavailable.");
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

  it("releases biology_0905 only through a guarded exact-original thistle-funnel mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0905Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0905"');
    expect(script).toContain("biology-0905-schoolngr-original_705e2a37.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0413 only through a guarded exact-original digestive-system mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0413Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0413"');
    expect(script).toContain("biology-0413-schoolngr-source-only-v2_75d0867c.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("repairs biology_0749 only where exact public sources corroborate the III photosynthesis label and clean original figure", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0749SourceEuglenaRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0749"');
    expect(script).toContain("biology-0749-schoolngr-original_64d08afe.png");
    expect(script).toContain("replacementAnswerIndex: 0");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("repairs biology_1225 only where the exact JAMB 2025 source provides a clean original and identifies sucking as option D", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology1225SourceBeakRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_1225"');
    expect(script).toContain("biology-1225-myschool-original_353283bf.png");
    expect(script).toContain("replacementAnswerIndex: 3");
    expect(script).toContain("immutableFields.every");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("repairs the Kairo oxygen-evolution record only where exact JAMB 2009 sources provide a clean X/Y/Z/R graph and source-proven content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairChemistryKclo3OxygenGraphRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_bcfca8"');
    expect(script).toContain("chemistry-kclo3-schoolngr-original_4374f259.png");
    expect(script).toContain('replacementOptionsJson: \'["X","Y","Z","R"]\'');
    expect(script).toContain("replacementAnswerIndex: 3");
    expect(script).toContain("SET questionText = ?, optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("repairs the Kairo ideal-gas record only where exact JAMB 2011 sources provide a clean M/N/K/L graph and key N as option B", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairChemistryIdealGasGraphRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_ea3781"');
    expect(script).toContain("chemistry-ideal-gas-schoolngr-original_002271ae.png");
    expect(script).toContain("replacementAnswerIndex: 1");
    expect(script).toContain("SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("releases biology_0562 only through a guarded clean exact-original photosynthesis-arrow mapping that preserves protected content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0562Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0562"');
    expect(script).toContain("biology-0562-testdriller-original_301dd58c.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0551 only through a guarded clean exact-original emulsification mapping that preserves the active D/IV source-supported fields", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0551Diagram.mjs"), "utf8");
    const addendum = JSON.parse(readFileSync(resolve(import.meta.dirname, "../reports/biology_0551_answer_conflict_addendum_20260826.json"), "utf8"));
    expect(script).toContain('externalId: "biology_0551"');
    expect(script).toContain("biology-0551-testdriller-original_7dc25806.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
    expect(addendum.answerDecision).toContain("SchoolNGR reports D/IV");
    expect(addendum.answerDecision).toContain("TestDriller reports B/II");
    expect(addendum.answerDecision).toContain("not treated as independent answer authority");
    expect(addendum.correctionRule).toContain("Do not alter the key or explanation");
  });

  it("repairs biology_0583 only through a guarded clean exact-original plantation-graph and A/III key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0583PlantationGraphRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0583"');
    expect(script).toContain("biology-0583-testdriller-original_99e7eb08.png");
    expect(script).toContain("currentAnswerIndex: 2");
    expect(script).toContain("replacementAnswerIndex: 0");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
  });

  it("releases biology_0574 only through a guarded clean exact-original four-animal mapping that preserves all answer fields", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0574Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0574"');
    expect(script).toContain("biology-0574-testdriller-original_23e441c0.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("repairs biology_0552 only through a guarded clean exact-original digestive-system and C/acidic key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0552DigestiveAcidityRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0552"');
    expect(script).toContain("biology-0552-testdriller-original_2097df8d.png");
    expect(script).toContain("currentAnswerIndex: 1");
    expect(script).toContain("replacementAnswerIndex: 2");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
  });

  it("repairs biology_0569 only through a guarded clean exact-original raptor figure and A/flesh key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0569RaptorFeedingRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0569"');
    expect(script).toContain("biology-0569-testdriller-original_ec8a36e9.png");
    expect(script).toContain("currentAnswerIndex: 2");
    expect(script).toContain("replacementAnswerIndex: 0");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
  });

  it("repairs biology_0584 only through a guarded byte-identical clean plantation graph and A/2m-high key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0584PlantationGraphRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0584"');
    expect(script).toContain("biology-0583-testdriller-original_99e7eb08.png");
    expect(script).toContain("currentAnswerIndex: 1");
    expect(script).toContain("replacementAnswerIndex: 0");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
  });

  it("releases biology_0536 only through a guarded clean exact-original leaf mapping that preserves the source-matching IV key", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0536Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0536"');
    expect(script).toContain("biology-0536-testdriller-original_a59c4d17.png");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0546 only through a guarded byte-identical clean leaf mapping that preserves the source-matching C/cuticle key", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0546Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0546"');
    expect(script).toContain("biology-0536-testdriller-original_a59c4d17.png");
    expect(script).toContain("byte-identical");
    expect(script).toContain("expectedCurrentDiagramUrl: null");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("repairs biology_0483 only through a guarded clean fungal-zygospore original and C-key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0483FungalZygosporeRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0483"');
    expect(script).toContain("biology-0483-testdriller-original_eb32af79.png");
    expect(script).toContain("currentAnswerIndex: 3");
    expect(script).toContain("replacementAnswerIndex: 2");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
  });

  it("repairs biology_0470 only through a guarded byte-identical fungal original and D/Rhizopus key correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0470RhizopusProcessRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0470"');
    expect(script).toContain("biology-0483-testdriller-original_eb32af79.png");
    expect(script).toContain("byte-identical");
    expect(script).toContain("currentAnswerIndex: 2");
    expect(script).toContain("replacementAnswerIndex: 3");
    expect(script).toContain("UPDATE questionItems SET answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET topic");
  });

  it("repairs biology_0480 only through a guarded clean dog-genetics original and source-proven wording, labels, and C/IV correction", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBiology0480DogGeneticsRecord.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0480"');
    expect(script).toContain("biology-0480-testdriller-original_4eb6cef1.png");
    expect(script).toContain('replacementOptionsJson: \'["II","I","IV","III"]\'');
    expect(script).toContain("replacementAnswerIndex: 2");
    expect(script).toContain("SET questionText = ?, optionsJson = ?, answerIndex = ?, explanation = ?, diagramUrl = ?");
    expect(script).toContain("immutableFields.every");
    expect(script).not.toContain("SET topic");
    expect(script).not.toContain("SET sourceId");
  });

  it("releases biology_0501 only through a guarded clean maize-inflorescence original while preserving the source-matching A/I content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0501Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0501"');
    expect(script).toContain("biology-0501-testdriller-original_53441b7a.png");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });

  it("releases biology_0502 only through a guarded clean Hydra-budding panel while preserving the source-matching D/budding content", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/releaseRecoveredBiology0502Diagram.mjs"), "utf8");
    expect(script).toContain('externalId: "biology_0502"');
    expect(script).toContain("biology-0502-testdriller-original_eea7904a.png");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET diagramUrl = ?");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
  });
});
