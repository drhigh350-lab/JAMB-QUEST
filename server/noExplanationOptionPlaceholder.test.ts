import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("no-explanation answer-option safety hold", () => {
  it("audits active literal placeholders and holds only affected records without changing protected content", () => {
    const audit = readFileSync(resolve(import.meta.dirname, "../scripts/auditNoExplanationOptionPlaceholders.mjs"), "utf8");
    const hold = readFileSync(resolve(import.meta.dirname, "../scripts/holdNoExplanationOptionPlaceholders.mjs"), "utf8");
    const preciseAudit = readFileSync(resolve(import.meta.dirname, "../scripts/auditApprovedOptionPlaceholdersPrecisely.mjs"), "utf8");
    const receipt = JSON.parse(readFileSync(resolve(import.meta.dirname, "../reports/no_explanation_option_placeholder_audit_20260826.json"), "utf8"));
    expect(audit).toContain("no explanation available");
    expect(audit).toContain("This audit makes no database mutation");
    expect(receipt.totalAffected).toBe(56);
    expect(receipt.bySubject).toEqual({ Biology: 56 });
    expect(receipt.answerPointsToPlaceholderExternalIds).toHaveLength(40);
    expect(hold).toContain("explanationStatus = 'needs_review'");
    expect(hold).toContain("protectedFields.every");
    expect(hold).toContain("unexpected placeholder-option audit cardinality");
    expect(hold).not.toContain("SET questionText");
    expect(hold).not.toContain("SET optionsJson");
    expect(hold).not.toContain("SET answerIndex");
    expect(hold).not.toContain("SET topic");
    expect(hold).not.toContain("SET explanation =");
    expect(hold).not.toContain("SET diagramUrl");
    expect(preciseAudit).toContain("JSON.parse(row.optionsJson)");
    expect(preciseAudit).toContain('? "empty" : "known_no_explanation"');
    expect(preciseAudit).toContain("quoted dialogue is parsed as ordinary option text");
  });
});
