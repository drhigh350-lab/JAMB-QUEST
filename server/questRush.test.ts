import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Quest Rush game mode", () => {
  it("uses active approved questions in short timed subject bursts without replacing CBT", () => {
    const component = readFileSync("client/src/components/QuestRush.tsx", "utf8");
    expect(component).toContain("const ROUND_LENGTH = 12");
    expect(component).toContain("const ROUND_SECONDS = 75");
    expect(component).toContain('question.subject === subject');
    expect(component).toContain("Does not overwrite your CBT history");
    expect(component).toContain("Correct answer:");
    expect(component).toContain("onOpenCorrection");
    expect(component).toContain("paused");
    expect(component).toContain("autoStart");
  });
});
