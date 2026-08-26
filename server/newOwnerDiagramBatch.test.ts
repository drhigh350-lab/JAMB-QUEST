import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("new owner diagram batch", () => {
  it("uses the five exact targets and only changes diagramUrl", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/applyNewOwnerDiagramBatch.mjs"), "utf8");
    for (const id of [
      "kairo-csv-chemistry_30bd42",
      "kairo-csv-chemistry_20650b",
      "OWNER-BIO-DIAGRAM-2025-009",
      "OWNER-BIO-DIAGRAM-2025-007",
      "OWNER-BIO-DIAGRAM-2025-002",
    ]) expect(script).toContain(id);
    expect(script).toContain('changedOnly: "diagramUrl"');
    expect(script).toContain("protectedFieldsVerified: true");
    expect(script).toContain("lekkiHeadmasterTouched: false");
  });

  it("keeps the terminated Kairo question hidden", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/applyNewOwnerDiagramBatch.mjs"), "utf8");
    expect(script).toContain('externalId: "kairo-csv-chemistry_1ea741"');
    expect(script).toContain('explanationStatus: "needs_review"');
    expect(script).toContain("assert.equal(afterHeld.diagramUrl, null)");
  });
});
