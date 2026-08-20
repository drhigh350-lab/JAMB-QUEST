import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildAchievementShareCardSvg } from "../client/src/game/achievementShareCard";

describe("shareable achievement cards", () => {
  it("builds a branded card from supplied earned-achievement evidence", () => {
    const card = buildAchievementShareCardSvg({
      key: "answers-100",
      label: "Century builder",
      note: "Answer 100 questions",
      category: "practice",
      target: 100,
      evidenceValue: 124,
      learnerName: "Amina",
      earnedOn: "Recorded in JAMB Quest",
    });

    expect(card).toContain("JAMB QUEST");
    expect(card).toContain("Century builder");
    expect(card).toContain("Amina");
    expect(card).toContain("124 / 100 evidence reached");
    expect(card).toContain("BUILD YOUR SYSTEM. WIN JAMB.");
  });

  it("exposes download and share controls only for actual earned badges", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(home).toContain("badge.earned ? <span className=\"achievement-share-actions\">");
    expect(home).toContain("downloadAchievementShareCard");
    expect(home).toContain("shareAchievementShareCard");
    expect(home).toContain("shareDailyGoalAchievement");
  });
});
