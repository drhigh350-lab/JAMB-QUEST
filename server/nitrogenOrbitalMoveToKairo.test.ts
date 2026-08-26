import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("nitrogen orbital picture move", () => {
  it("moves the owner image to Kairo nitrogen and clears it from Chemistry 036", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/moveNitrogenOrbitalToKairo.mjs"), "utf8");
    expect(script).toContain('externalId: "supplied-keyed-2021-chemistry-036"');
    expect(script).toContain('externalId: "kairo-csv-chemistry_2bdf6a"');
    expect(script).toContain("Chemistry 036 still has the orbital picture");
    expect(script).toContain("Kairo nitrogen picture was not saved");
    expect(script).toContain("protectedFieldsVerified: true");
    expect(script).not.toContain("DELETE FROM");
  });

  it("keeps the wrong question held and the Kairo nitrogen question visible", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/moveNitrogenOrbitalToKairo.mjs"), "utf8");
    expect(script).toContain("sourceLearnerVisible: false");
    expect(script).toContain("destinationLearnerVisible: true");
    expect(script).toContain('explanationStatus: "needs_review"');
    expect(script).toContain('explanationStatus: "approved"');
  });
});
