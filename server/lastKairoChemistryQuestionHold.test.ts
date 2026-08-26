import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("last Kairo Chemistry question hold", () => {
  it("holds only the empty-picture structure question and does not reassign other images", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/holdLastKairoChemistryQuestion.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_1ea741"');
    expect(script).toContain("diagramUrl IS NULL");
    expect(script).toContain('newStatus: "needs_review"');
    expect(script).toContain('changedFields: ["explanationStatus"]');
    expect(script).toContain("ownerHistoryRetained: true");
    expect(script).toContain("Protected question fields changed");
    expect(script).not.toContain("DELETE FROM");
  });

  it("keeps old owner image filenames distinct from the held question", () => {
    const inspection = readFileSync(resolve(process.cwd(), "reports/latest_chemistry_rollback_targets_20260826.json"), "utf8");
    expect(inspection).toContain("chemistry-organic-structure-original_fa400ff1.png");
    expect(inspection).toContain("chemistry-energy-profile-original_3e1f7670.png");
    expect(inspection).toContain("kairo-csv-chemistry_1ea741");
  });
});
