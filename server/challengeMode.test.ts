import { describe, expect, it } from "vitest";
import { calculateChallengeScore, cleanChallengeName } from "./db";

describe("Challenge Mode rules", () => {
  it("keeps creator names readable and capped", () => {
    expect(cleanChallengeName("  Biology   Boss   Battle  ")).toBe("Biology Boss Battle");
    expect(cleanChallengeName("x".repeat(100))).toHaveLength(80);
  });

  it("rewards correct answers first and speed second", () => {
    expect(calculateChallengeScore(8, 120)).toBeGreaterThan(calculateChallengeScore(7, 1));
    expect(calculateChallengeScore(7, 30)).toBeGreaterThan(calculateChallengeScore(7, 90));
  });

  it("does not give a negative speed bonus for a very slow attempt", () => {
    expect(calculateChallengeScore(0, 999999)).toBe(0);
  });
});
