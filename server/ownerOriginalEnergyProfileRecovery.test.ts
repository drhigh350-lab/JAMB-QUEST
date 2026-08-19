import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner-original Chemistry energy-profile recovery", () => {
  const report = readFileSync(resolve(import.meta.dirname, "../reports/owner_drive_figure_recovery_aug19.md"), "utf8");
  const fixture = readFileSync(resolve(import.meta.dirname, "../client/src/e2e/OwnerOriginalEnergyProfileFixture.tsx"), "utf8");

  it("uses the owner-provided source figure for the matching held record rather than a reconstruction", () => {
    expect(report).toContain("`1050122` / `kairo-csv-chemistry_20650b`");
    expect(report).toContain("`CHEMISTRY-JAMB-Past-Questions_copy.pdf`");
    expect(report).toContain("no answer word, key, explanation, or option text");
    expect(existsSync("/home/ubuntu/webdev-static-assets/owner-original-diagrams/chemistry-energy-profile-original.png")).toBe(true);
  });

  it("renders the original figure with its exact question but never places the correct answer inside the asset path", () => {
    expect(fixture).toContain("kairo-csv-chemistry_20650b");
    expect(fixture).toContain("/manus-storage/chemistry-energy-profile-original_3e1f7670.png");
    expect(fixture).toContain("In the energy profile diagram above, X represents the:");
    expect(fixture).toContain('answer_index: 2');
    expect(fixture).not.toContain("activation-energy-answer");
  });
});
