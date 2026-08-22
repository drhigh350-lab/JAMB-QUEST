import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("owner Biology segment gate", () => {
  it("keeps the absent 26–50 segment explicit and requires duplicate, structure, and exact-topic gates", () => {
    const audit = readFileSync("scripts/auditOwnerBiologySegments.mts", "utf8");
    const receipt = readFileSync("reports/owner_biology_segments_audit.json", "utf8");
    expect(audit).toContain('explicitlyMissingRange: "26–50"');
    expect(audit).toContain("function topicFor");
    expect(audit).toContain("Duplicate hold");
    expect(audit).toContain("Structural hold");
    expect(receipt).toContain('"parsedCount": 75');
    expect(receipt).toContain('"eligibleCount": 75');
    expect(receipt).toContain('"heldCount": 0');
  });
});
