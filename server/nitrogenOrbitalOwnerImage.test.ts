import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner nitrogen orbital image", () => {
  it("maps one held Chemistry record without releasing or changing its content", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/attachNitrogenOrbitalImage.mjs"), "utf8");
    expect(script).toContain('externalId: "supplied-keyed-2021-chemistry-036"');
    expect(script).toContain('diagramUrl: "/manus-storage/nitrogen-orbital-owner-supplied-20260826_9c7bddd0.png"');
    expect(script).toContain('explanationStatus: "needs_review"');
    expect(script).toContain("questionRemainsHeld: true");
    expect(script).toContain("Protected fields changed");
    expect(script).toContain("sourceId = ?");
    expect(script).not.toContain("DELETE FROM");
  });
});
