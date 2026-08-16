import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reports = resolve(import.meta.dirname, "../reports");

describe("quality-boundary receipts", () => {
  it("keeps the all-subject PDF outside gameplay until answer evidence is reliable", () => {
    const receipt = JSON.parse(readFileSync(resolve(reports, "all_subject_pdf_structural_stage_receipt.json"), "utf8"));
    expect(receipt.totalQuestionStarts).toBe(3095);
    expect(receipt.stagingDecision).toMatch(/No gameplay staging or import/);
    expect(receipt.answerKeyEvidence).toMatch(/no embedded usable answer key/);
  });

  it("preserves the model-bank provenance uncertainty instead of inventing an AI generation history", () => {
    const audit = JSON.parse(readFileSync(resolve(reports, "model_bank_provenance_audit.json"), "utf8"));
    expect(audit.records.total).toBe(1000);
    expect(audit.records.labelRepaired).toBe(8);
    expect(audit.records.withheldFromActiveAsset).toBe(0);
    expect(audit.classification.historicAiWritingStatus).toMatch(/unproven/);
  });
});
