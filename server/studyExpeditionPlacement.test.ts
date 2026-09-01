import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Concise Practice route placement", () => {
  it("keeps Standard CBT first, places Topic Drill and Syllabus Journey inside Practice, and Arcade in its own tab", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practicePath = home.indexOf('data-testid="single-subject-path"');
    const standardCbtPath = home.indexOf('data-testid="standard-cbt-path"');
    const lekkiPath = home.indexOf('data-testid="lekki-practice-path"');
    const practiceSection = home.indexOf('{activeTab === "practice"');
    const progressSection = home.indexOf('{activeTab === "progress"');
    const topicDrill = home.indexOf('data-testid="topic-drill-destination"');
    const journey = home.indexOf('data-testid="syllabus-journey-destination"');
    const arcadeTab = home.indexOf('{ id: "arcade", label: "Arcade", icon: Swords }');

    expect(practicePath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeLessThan(practicePath);
    expect(lekkiPath).toBeGreaterThan(practicePath);
    expect(practiceSection).toBeGreaterThan(-1);
    expect(progressSection).toBeGreaterThan(lekkiPath);
    expect(topicDrill).toBeGreaterThan(lekkiPath);
    expect(journey).toBeGreaterThan(topicDrill);
    expect(arcadeTab).toBeGreaterThan(-1);
    expect(home).not.toContain('data-testid="quest-rush-path"');
    const practice = home.slice(practiceSection, progressSection);
    expect(practice).toContain('aria-label="Study tools inside Practice"');
    expect(practice).toContain('data-testid="topic-drill-destination"');
    expect(practice).toContain('data-testid="syllabus-journey-destination"');
    expect(practice).not.toContain('data-testid="game-arcade-destination"');
    expect(home).toContain('type AppTab = "practice" | "arcade" | "progress" | "profile" | "about"');
    expect(home).not.toContain("OPTIONAL GAME DESK / JAMB QUEST ARCADE");
    expect(home).not.toContain("LIVE DESK");
    expect(home).not.toContain("Your goal is built through daily action");
    expect(home).toContain("Choose a practice path or go deeper with the official syllabus. Your progress updates as you go.");

    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("activeQuestions={game.questions}");
    expect(app).not.toContain('requested === "study"');

    const styles = readFileSync("client/src/components/study-destinations.css", "utf8");
    expect(styles).toContain(".app-tabbar{grid-template-columns:repeat(5,1fr)");
    expect(styles).toContain(".study-destination-grid{display:grid;grid-template-columns:1fr");
  });
});
