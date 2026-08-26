import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("visible diagram-description cleanup", () => {
  it("cleans only the stored bracketed prefix and preserves linked visuals and all protected fields", () => {
    const inventory = readFileSync(resolve(process.cwd(), "scripts/inspectDiagramDescriptionPrefixesAndKairoImages.mjs"), "utf8");
    const cleanup = readFileSync(resolve(process.cwd(), "scripts/removeVisibleDiagramDescriptionPrefixes.mjs"), "utf8");
    expect(inventory).toContain("visibleDiagramDescriptionPrefixes");
    expect(inventory).toContain("kairoImageRecords");
    expect(cleanup).toContain("assert.equal(targets.length, 6");
    expect(cleanup).toContain("SET questionText = ?");
    expect(cleanup).not.toContain("SET diagramUrl");
    expect(cleanup).toContain("diagramLinksChanged: false");
    expect(cleanup).toContain("protectedSnapshot");
    expect(cleanup).toContain("Lekki record");
  });
});
