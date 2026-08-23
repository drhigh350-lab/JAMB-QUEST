import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Study Expedition Practice placement", () => {
  it("keeps Standard CBT first, keeps focused subject practice compact, then presents Study Expedition as the final dedicated destination", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    const practicePath = home.indexOf('data-testid="single-subject-path"');
    const standardCbtPath = home.indexOf('data-testid="standard-cbt-path"');
    const topicDesk = home.indexOf('eyebrow="03 / TOPIC"');
    const expeditionDestination = home.indexOf('data-testid="study-expedition-destination"');

    expect(practicePath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeGreaterThan(-1);
    expect(standardCbtPath).toBeLessThan(practicePath);
    expect(home).not.toContain('data-testid="quest-rush-path"');
    expect(expeditionDestination).toBeGreaterThan(topicDesk);
    expect(home).toContain('data-testid="game-arcade-path"');
    expect(home).toContain("OPTIONAL GAME DESK / JAMB QUEST ARCADE");

    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("activeQuestions={game.questions}");
  });
});
