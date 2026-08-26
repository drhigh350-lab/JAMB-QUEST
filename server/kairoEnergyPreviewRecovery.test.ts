import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Kairo energy preview recovery", () => {
  it("changes only the exact energy image link", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/restoreKairoEnergyProfilePreview.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_20650b"');
    expect(script).toContain("chemistry-energy-profile-original-20260826_69a97b4c.png");
    expect(script).toContain('changedFields: ["diagramUrl"]');
    expect(script).toContain("Protected fields changed");
    expect(script).not.toContain("DELETE FROM");
  });

  it("does not touch the held last Kairo organic question", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/holdLastKairoChemistryQuestion.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_1ea741"');
    expect(script).toContain('newStatus: "needs_review"');
    expect(script).toContain("diagramUrl IS NULL");
  });
});
