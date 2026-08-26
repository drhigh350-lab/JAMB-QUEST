import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("confirmed owner diagram batch", () => {
  it("limits the batch to the benzene removal and two owner-supplied clean replacement images", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/applyConfirmedOwnerBatchDiagramChanges.mjs"), "utf8");
    const notes = readFileSync(resolve(process.cwd(), "scripts/removeBracketedDiagramTopNotes.mjs"), "utf8");
    const fixture = readFileSync(resolve(process.cwd(), "client/src/e2e/DiagramRenderingFixture.tsx"), "utf8");
    expect(script).toContain("chem-docx-240");
    expect(script).toContain("biology-dr-high-0012");
    expect(script).toContain("biology-dr-high-0013");
    expect(script).toContain("OWNER-BIO-DIAGRAM-2025-001");
    expect(script).toContain("owner-plant-transport-clean-20260826_d0f60ce0.png");
    expect(script).toContain("owner-rr-cross-clean-20260826_58261e88.png");
    expect(script).toContain("kairoChanged: false");
    expect(script).toContain("lekkiHeadmasterChanged: false");
    expect(notes).toContain("targetCount: targets.length");
    expect(fixture).toContain("ownerCleanRr");
    expect(fixture).toContain("benzeneNoPicture");
  });
});
