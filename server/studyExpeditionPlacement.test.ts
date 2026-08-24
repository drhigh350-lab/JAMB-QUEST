import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Concise Practice route placement", () => {
  it("keeps Standard CBT first and brings syllabus and game routes into the compact Practice chooser", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practicePath = home.indexOf('data-testid="single-subject-path"');
    const standardCbtPath = home.indexOf('data-testid="standard-cbt-path"');
    const lekkiPath = home.indexOf('data-testid="lekki-practice-path"');
    const syllabusPath = home.indexOf('data-testid="syllabus-journey-path"');
    const arcadePath = home.indexOf('data-testid="game-arcade-path"');

    expect(practicePath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeLessThan(practicePath);
    expect(lekkiPath).toBeGreaterThan(practicePath);
    expect(syllabusPath).toBeGreaterThan(lekkiPath);
    expect(arcadePath).toBeGreaterThan(syllabusPath);
    expect(home).not.toContain('data-testid="quest-rush-path"');
    expect(home).toContain('className="practice-route-choice-grid"');
    expect(home).not.toContain('data-testid="study-expedition-destination"');
    expect(home).not.toContain("OPTIONAL GAME DESK / JAMB QUEST ARCADE");
    expect(home).not.toContain("LIVE DESK");
    expect(home).not.toContain("Your goal is built through daily action");
    expect(home).toContain("Choose a practice path. Your progress updates as you go.");

    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("activeQuestions={game.questions}");
  });
});
