import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDailyGoalAchievementSvg } from "../client/src/game/dailyGoalAchievement";

describe("Progress reward and correction-log experience", () => {
  it("builds a downloadable achievement only from supplied daily completion evidence", () => {
    const image = buildDailyGoalAchievementSvg({
      learnerName: "Ada",
      dateKey: "2026-08-20",
      goalCount: 20,
      questionsAnswered: 20,
      correctCount: 17,
      streak: 4,
    });

    expect(image).toContain("Ada");
    expect(image).toContain("17/20 correct");
    expect(image).toContain("85% accuracy");
    expect(image).toContain("4 day system");
  });

  it("keeps the Revision Shelf weekly and the exam log independently scrollable", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const review = readFileSync(resolve(process.cwd(), "client/src/components/ExamReview.tsx"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "client/src/field-notes-overrides.css"), "utf8");

    expect(home).toContain("WEEKLY REVISION");
    expect(home).toContain("Final-day review stays separate");
    expect(home).toContain("compact-log-list");
    expect(review).toContain('aria-label="Scrollable CBT correction log"');
    expect(css).toContain(".compact-log-list { max-height:");
    expect(css).toContain(".exam-review-list { max-height:");
    expect(css).toContain(".progress-signal-grid strong { color: var(--ink); font: 800 1.02rem");
  });
});
