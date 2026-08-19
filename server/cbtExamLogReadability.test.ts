import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("saved CBT log readability", () => {
  it("shows the learner accuracy, correct count, misses, flags, timing, and full correction action", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("round.correctCount}/{round.questionCount} correct");
    expect(home).toContain('misses === 1 ? "miss" : "misses"');
    expect(home).toContain('round.flaggedCount === 1 ? "flag" : "flags"');
    expect(home).toContain("Open full correction");
    expect(home).toContain('aria-label={`${accuracy}% accuracy`}');
  });
});
