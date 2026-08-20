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

    expect(card).toContain("jamb-quest-official-wordmark-transparent_789d0e04.png");
    expect(card).toContain("Century builder");
    expect(card).toContain("Amina");
    expect(card).toContain("124 / 100 evidence reached");
    expect(card).toContain("jamb-quest-official-wordmark-transparent_789d0e04.png");
    expect(card).toContain("preserveAspectRatio=\"xMinYMid meet\"");
    expect(card).toContain("BUILD YOUR SYSTEM.");
    expect(card).toContain("WIN JAMB.");
    expect(card).toContain('width="1080" height="1920"');
    expect(card).toContain('transform="translate(540 650)"');
    expect(card).toContain('y="1135"');
    expect(card).toContain('textLength="810"');
  });

  it("exposes download and share controls only for actual earned badges", () => {
    const home = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(home).toContain("badge.earned ? <span className=\"achievement-share-actions\">");
    expect(home).toContain("downloadAchievementShareCard");
    expect(home).toContain("shareAchievementShareCard");
    expect(home).toContain("shareDailyGoalAchievement");
  });

  it("uses a PNG file for Android-compatible native sharing before an honest download fallback", () => {
    const shareHelper = readFileSync("client/src/game/shareCardFile.ts", "utf8");
    expect(shareHelper).toContain('type: "image/png"');
    expect(shareHelper).toContain("canvas.width = width");
    expect(shareHelper).toContain("canvas.height = height");
    expect(shareHelper).toContain("navigator.share(data)");
    expect(shareHelper).toContain("navigator.canShare(data)");
    expect(shareHelper).toContain("AbortError");
  });
});
