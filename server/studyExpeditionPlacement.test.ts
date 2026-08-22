import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Study Expedition Practice placement", () => {
  it("keeps normal practice and Standard CBT clean, then presents Study Expedition as the final dedicated destination", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practicePath = home.indexOf('data-testid="single-subject-path"');
    const standardCbtPath = home.indexOf('data-testid="standard-cbt-path"');
    const topicDesk = home.indexOf('eyebrow="03 / TOPIC"');
    const expeditionDestination = home.indexOf('data-testid="study-expedition-destination"');

    expect(practicePath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeGreaterThan(practicePath);
    expect(home).not.toContain('data-testid="quest-rush-path"');
    expect(expeditionDestination).toBeGreaterThan(topicDesk);
    expect(home).toContain('data-testid="study-expedition-path"');
    expect(home).toContain("OPTIONAL GAME DESK / STUDY EXPEDITION");
  });
});
