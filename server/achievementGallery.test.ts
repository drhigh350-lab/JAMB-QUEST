import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_BADGES, summariseAchievements } from "../client/src/game/achievements";

describe("achievement gallery", () => {
  it("defines exactly fifty evidence-based badges", () => {
    expect(ACHIEVEMENT_BADGES).toHaveLength(50);
    expect(new Set(ACHIEVEMENT_BADGES.map((badge) => badge.key)).size).toBe(50);
  });

  it("unlocks only achievements supported by learner evidence and reports the next one", () => {
    const summary = summariseAchievements({ totalAnswered: 100, totalCorrect: 70, roundsPlayed: 5, longestStreak: 3, comebackXp: 100, activeDays: 3, completedGoalDays: 1, cbtRounds: 1, fullMocks: 0, subjectsPractised: ["Biology", "Chemistry"], subjectPerformance: [{ subject: "Biology", attempts: 20, accuracy: 70 }] });
    expect(summary.earned.map((badge) => badge.key)).toContain("answers-100");
    expect(summary.earned.map((badge) => badge.key)).toContain("accuracy-70");
    expect(summary.earned.map((badge) => badge.key)).not.toContain("mock-1");
    expect(summary.next).not.toBeNull();
  });
});
