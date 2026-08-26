import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner-supplied non-Kairo biology diagram mappings", () => {
  it("maps only verified owner images, preserves question data, and leaves the conflicting spine image unmapped", () => {
    const mapping = readFileSync(resolve(process.cwd(), "scripts/mapVerifiedOwnerSuppliedBiologyDiagrams.mjs"), "utf8");
    const fixture = readFileSync(resolve(process.cwd(), "client/src/e2e/DiagramRenderingFixture.tsx"), "utf8");
    expect(mapping).toContain("mappedRecordCount: records.length");
    expect(mapping).toContain("NOT_KAIRO");
    expect(mapping).toContain("NOT_LEKKI");
    expect(mapping).toContain("questionTextChanged: false");
    expect(mapping).toContain("ChatGPTImageAug26,2026,12_40_22PM.png");
    expect(mapping).toContain("conflicts with the stored II/cervical key");
    expect(mapping).toContain("owner-yam-osmosis-20260826_8e443547.png");
    expect(mapping).toContain("owner-skin-arrector-pili-20260826_c158c886.png");
    expect(fixture).toContain("ownerFlower");
    expect(fixture).toContain("ownerSpine");
    expect(fixture).toContain("ownerOsmosis");
    expect(fixture).toContain("ownerSkin");
  });
});
