import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("plant transport preview recovery", () => {
  it("uses a fresh copy of the verified Owner Biology DOCX image for only the two affected records", () => {
    const recovery = readFileSync(resolve(process.cwd(), "scripts/restoreBrokenPlantTransportPreview.mjs"), "utf8");
    const fixture = readFileSync(resolve(process.cwd(), "client/src/e2e/DiagramRenderingFixture.tsx"), "utf8");
    expect(recovery).toContain("biology-dr-high-0012");
    expect(recovery).toContain("biology-dr-high-0013");
    expect(recovery).toContain("owner-biology-plant-transport-restored-20260826_8317ae86.png");
    expect(recovery).toContain("questionTextChanged: false");
    expect(recovery).toContain("kairoChanged: false");
    expect(recovery).toContain("lekkiHeadmasterChanged: false");
    expect(fixture).toContain("ownerPlantTransport");
  });
});
