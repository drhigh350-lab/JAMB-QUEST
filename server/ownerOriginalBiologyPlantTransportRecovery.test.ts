import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("owner-original Biology plant-transport recovery", () => {
  const report = readFileSync(resolve(import.meta.dirname, "../reports/owner_drive_figure_recovery_aug19.md"), "utf8");
  const fixture = readFileSync(resolve(import.meta.dirname, "../client/src/e2e/OwnerOriginalBiologyPlantTransportFixture.tsx"), "utf8");

  it("uses one matching owner-provided figure for both held arrow-labelled Biology records", () => {
    expect(report).toContain("`750005` / `biology-dr-high-0012`");
    expect(report).toContain("`750006` / `biology-dr-high-0013`");
    expect(report).toContain("`JAMB Biology Past Questions 2010 - 2018_copy.pdf`");
    expect(report).toContain("excludes the heading, all question and option text, the answer keys");
    expect(existsSync("/home/ubuntu/webdev-static-assets/owner-original-diagrams/biology-plant-transport-original.png")).toBe(true);
  });

  it("keeps the source visual separate from the answer data on the learner card", () => {
    expect(fixture).toContain("biology-dr-high-0012");
    expect(fixture).toContain("/manus-storage/biology-plant-transport-original_1e2a8b38.png");
    expect(fixture).toContain("The movement of material in the xylem and phloem tissues of the plant");
    expect(fixture).toContain('answer_index: 0');
    expect(fixture).not.toContain("xylem-phloem-answer");
  });
});
