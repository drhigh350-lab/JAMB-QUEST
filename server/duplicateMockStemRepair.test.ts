import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("duplicate JAMB Mock stem repair", () => {
  it("requires an exact repeated stem plus Options marker and changes only questionText", () => {
    const preflight = readFileSync(resolve(import.meta.dirname, "../scripts/preflightDuplicateMockStemRepair.mjs"), "utf8");
    const repair = readFileSync(resolve(import.meta.dirname, "../scripts/repairDuplicateMockStems.mjs"), "utf8");
    expect(preflight).toContain("sourceIds = [1230003, 1290001]");
    expect(preflight).toContain("exact duplicated sentence plus trailing Options:");
    expect(preflight).not.toContain("UPDATE questionItems");
    expect(repair).toContain("UPDATE questionItems SET questionText = ?");
    expect(repair).toContain("protectedFields.every");
    expect(repair).toContain("questionText = ?");
    expect(repair).toContain("alreadyRepaired");
    expect(repair).not.toContain("SET optionsJson");
    expect(repair).not.toContain("SET answerIndex");
    expect(repair).not.toContain("SET explanation");
  });
});
