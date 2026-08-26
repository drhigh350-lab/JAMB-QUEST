import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Tutor Dave option-D leak repair", () => {
  it("changes only preflight-proven optionsJson rows while locking all learner-facing protected fields", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairTutorDaveOptionDLeaks.mjs"), "utf8");
    expect(script).toContain("candidate.safe");
    expect(script).toContain("replacementOptionsJson");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("UPDATE questionItems SET optionsJson = ?");
    expect(script).toContain("diagramUrl <=> ?");
    expect(script).toContain("alreadyRepaired");
    expect(script).toContain("post-update verification failed");
    expect(script).not.toContain("SET answerIndex");
    expect(script).not.toContain("SET explanation");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET topic");
  });
});
