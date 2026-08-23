import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner PDF answer-matched Biology 151–250 and Chemistry 1–200 intake", () => {
  it("uses only the three declared owner answer files and preserves source holds outside release", () => {
    const audit = readFileSync("scripts/auditQuestionsOnlyPdfBatches5To7.mts", "utf8");
    expect(audit).toContain("Biology_Batch5_Q151-250.md");
    expect(audit).toContain("Chemistry_Batch6_Q1-100.md");
    expect(audit).toContain("Chemistry_Batch7_Q101-200.md");
    expect(audit).toContain('start: 151, end: 250');
    expect(audit).toContain('start: 1, end: 100');
    expect(audit).toContain('start: 101, end: 200');
    expect(audit).toContain("Answer-key hold");
    expect(audit).toContain("Option-integrity hold");
    expect(audit).toContain("Syllabus hold");
  });

  it("validates staged records against both the authorised ledger and protected model bank before release", () => {
    const validator = readFileSync("scripts/validateQuestionsOnlyPdfBatches5To7Stage.mts", "utf8");
    expect(validator).toContain("Expected exactly 287 unique eligible records");
    expect(validator).toContain("modelPayload.questions.length !== 1000");
    expect(validator).toContain("ledgerFingerprints");
    expect(validator).toContain("modelFingerprints");
    expect(validator).toContain("Unified duplicate hold");
  });

  it("imports per exact source label and approves only successfully protected imported rows", () => {
    const release = readFileSync("scripts/releaseQuestionsOnlyPdfBatches5To7.mts", "utf8");
    expect(release).toContain("importAuthorisedQuestionSet");
    expect(release).toContain('explanationStatus !== "needs_review"');
    expect(release).toContain('set({ explanationStatus: "approved" })');
    expect(release).toContain("heldCount: 13");
    expect(release).toContain("preservedProtectedFields");
  });
});
