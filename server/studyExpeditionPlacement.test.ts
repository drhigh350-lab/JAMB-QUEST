import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Concise Practice route placement", () => {
  it("keeps Standard CBT first while moving Topic Drill, Syllabus Journey, and Arcade into a separate Study destination", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practicePath = home.indexOf('data-testid="single-subject-path"');
    const standardCbtPath = home.indexOf('data-testid="standard-cbt-path"');
    const lekkiPath = home.indexOf('data-testid="lekki-practice-path"');
    const studySection = home.indexOf('{activeTab === "study"');
    const topicDrill = home.indexOf('data-testid="topic-drill-destination"');
    const journey = home.indexOf('data-testid="syllabus-journey-destination"');
    const arcade = home.indexOf('data-testid="game-arcade-destination"');

    expect(practicePath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeLessThan(practicePath);
    expect(lekkiPath).toBeGreaterThan(practicePath);
    expect(studySection).toBeGreaterThan(lekkiPath);
    expect(topicDrill).toBeGreaterThan(studySection);
    expect(journey).toBeGreaterThan(topicDrill);
    expect(arcade).toBeGreaterThan(journey);
    expect(home).not.toContain('data-testid="quest-rush-path"');
    const practice = home.slice(home.indexOf('{activeTab === "practice"'), studySection);
    expect(practice).not.toContain('syllabus-journey-path');
    expect(practice).not.toContain('game-arcade-path');
    expect(home).toContain('type AppTab = "practice" | "study"');
    expect(home).not.toContain("OPTIONAL GAME DESK / JAMB QUEST ARCADE");
    expect(home).not.toContain("LIVE DESK");
    expect(home).not.toContain("Your goal is built through daily action");
    expect(home).toContain("Choose a practice path. Your progress updates as you go.");

    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("activeQuestions={game.questions}");
    expect(app).toContain('requested === "study"');
  });
});
