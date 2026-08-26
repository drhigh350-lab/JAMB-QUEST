import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("non-Lekki external-audit reproduction", () => {
  it("uses a read-only classifier that excludes Lekki Headmaster source and content records", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/auditNonLekkiExternalFindings.mjs"), "utf8");
    expect(script).toContain("LOWER(COALESCE(qs.label, '')) LIKE '%lekki headmaster%'");
    expect(script).toContain("LOWER(qi.questionText) LIKE '%lekki headmaster%'");
    expect(script).toContain("answer_and_explanation_leaked_in_option_d");
    expect(script).toContain("duplicated_stem_with_options_marker");
    expect(script).toContain("visual_reference_without_asset_or_existing_hold");
    expect(script).toContain("hold for exact original visual");
    expect(script).toContain("byIssueTypeAndSource");
    expect(script).toContain("samplesByIssueType");
    expect(script).not.toContain("UPDATE questionItems");
    expect(script).not.toContain("INSERT INTO");
    expect(script).not.toContain("DELETE FROM");
  });
});
