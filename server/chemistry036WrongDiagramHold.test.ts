import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Chemistry 036 wrong-diagram hold", () => {
  it("changes only the picture link and review status for the exact record", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/holdChemistry036WrongDiagram.mjs"), "utf8");
    expect(script).toContain('externalId: "supplied-keyed-2021-chemistry-036"');
    expect(script).toContain("newDiagramUrl: null");
    expect(script).toContain('newExplanationStatus: "needs_review"');
    expect(script).toContain('changedFields: ["diagramUrl", "explanationStatus"]');
    expect(script).toContain("ownerHistoryRetained: true");
    expect(script).toContain("Protected question content changed");
    expect(script).toContain("sourceId = ?");
    expect(script).toContain("explanation <=> ?");
    expect(script).not.toContain("DELETE FROM");
  });
});
