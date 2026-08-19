import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner-original Chemistry organic-structure recovery", () => {
  const report = readFileSync(resolve(import.meta.dirname, "../reports/owner_drive_figure_recovery_aug19.md"), "utf8");
  const fixture = readFileSync(resolve(import.meta.dirname, "../client/src/e2e/OwnerOriginalOrganicStructureFixture.tsx"), "utf8");

  it("uses the matching owner-provided structure rather than a reconstruction", () => {
    expect(report).toContain("`1050171` / `kairo-csv-chemistry_30bd42`");
    expect(report).toContain("`JAMB-CHEMISTRY-PAST-QUESTIONS_copy.pdf`");
    expect(report).toContain("exclude the question sentence, answer options, answer key");
    expect(existsSync("/home/ubuntu/webdev-static-assets/owner-original-diagrams/chemistry-organic-structure-original.png")).toBe(true);
  });

  it("renders only the original structure with its exact question and keeps the answer in the question data", () => {
    expect(fixture).toContain("kairo-csv-chemistry_30bd42");
    expect(fixture).toContain("/manus-storage/chemistry-organic-structure-original_fa400ff1.png");
    expect(fixture).toContain("The IUPAC nomenclature for the compound above is:");
    expect(fixture).toContain('answer_index: 0');
    expect(fixture).not.toContain("4-methylpent-1-ene-answer");
  });
});
