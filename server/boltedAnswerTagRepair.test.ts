import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("bolted answer-tag repair", () => {
  it("changes only preflight-proven explanation text and preserves every question, option, key, source, and diagram field", () => {
    const script = readFileSync(resolve(import.meta.dirname, "../scripts/repairBoltedAnswerTags.mjs"), "utf8");
    expect(script).toContain("candidate.safe");
    expect(script).toContain("UPDATE questionItems SET explanation = ?");
    expect(script).toContain("protectedFields.every");
    expect(script).toContain("diagramUrl <=> ?");
    expect(script).toContain("alreadyRepaired");
    expect(script).not.toContain("SET optionsJson");
    expect(script).not.toContain("SET answerIndex");
    expect(script).not.toContain("SET questionText");
    expect(script).not.toContain("SET topic");
  });
});
