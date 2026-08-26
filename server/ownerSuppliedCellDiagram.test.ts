import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner-supplied Biology cell diagram", () => {
  it("uses the submitted image for only the exact protected cell question", () => {
    const replacement = readFileSync(resolve(process.cwd(), "scripts/replaceOwnerSuppliedCellDiagram.mjs"), "utf8");
    const fixture = readFileSync(resolve(process.cwd(), "client/src/e2e/DiagramRenderingFixture.tsx"), "utf8");
    const fixtureRoute = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    expect(replacement).toContain('id: 1020055');
    expect(replacement).toContain('externalId: "supplied-keyed-2004-biology-032"');
    expect(replacement).toContain('newDiagramUrl: "/manus-storage/owner-supplied-biology-cell-label-ii-361163_9a80424a.png"');
    expect(replacement).toContain("protectedSnapshot");
    expect(replacement).toContain("learnerEligibilityChanged: false");
    expect(replacement).toContain("lekkiHeadmasterChanged: false");
    expect(fixture).toContain('ownerCell: {');
    expect(fixture).toContain('diagram_url: "/manus-storage/owner-supplied-biology-cell-label-ii-361163_9a80424a.png"');
    expect(fixtureRoute).toContain('value === "ownerCell"');
  });
});
