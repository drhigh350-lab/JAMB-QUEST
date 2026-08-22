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

    expect(card).toContain("jamb-quest-official-transparent-mark_70a776fe.png");
    expect(card).toContain("Century builder");
    expect(card).toContain("Amina");
    expect(card).toContain("124 / 100");
    expect(card).toContain("evidence reached");
    expect(card).toContain("preserveAspectRatio=\"xMinYMid meet\"");
    expect(card).toContain("BUILD YOUR SYSTEM.");
    expect(card).toContain("WIN JAMB.");
    expect(card).toContain('width="1080" height="1920"');
    expect(card).toContain('transform="translate(540 650)"');
    expect(card).toContain('y="1100"');
    expect(card).toContain('<tspan x="540"');
    expect(card).not.toContain("textLength=");
    expect(card).not.toContain("lengthAdjust=");
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
    expect(shareHelper).toContain("inlineSvgImageHrefs");
    expect(shareHelper).toContain('fetch(href, { credentials: "same-origin" })');
    expect(shareHelper).toContain("reader.readAsDataURL(blob)");
    expect(shareHelper).toContain("selfContainedSvg");
    expect(shareHelper).toContain('type: "image/png"');
    expect(shareHelper).toContain("canvas.width = width");
    expect(shareHelper).toContain("canvas.height = height");
    expect(shareHelper).toContain("navigator.share(data)");
    expect(shareHelper).toContain("navigator.canShare(data)");
    expect(shareHelper).toContain("AbortError");
  });
});
