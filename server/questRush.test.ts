import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Study Expedition game mode", () => {
  it("uses approved subject questions in a strategic route-and-correction loop without replacing CBT", () => {
    const component = readFileSync("client/src/components/QuestRush.tsx", "utf8");
    expect(component).toContain("const contracts");
    expect(component).toContain("Scout Route");
    expect(component).toContain("Mastery Route");
    expect(component).toContain("const tools");
    expect(component).toContain("Topic Lens");
    expect(component).toContain("Focus Stamp");
    expect(component).toContain("Recovery Pass");
    expect(component).toContain('question.subject === subject');
    expect(component).toContain("No timer, no CBT overwrite, no chance mechanics");
    expect(component).toContain("Correct answer:");
    expect(component).toContain("onOpenCorrection");
    expect(component).toContain("repair cards");
    expect(component).toContain("readArcadeProfile().expedition");
    expect(component).toContain("writeArcadeProfile({ ...profile, expedition: next })");
    expect(component).toContain("autoStart");
  });
});
