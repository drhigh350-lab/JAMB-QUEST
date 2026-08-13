/* Field Notes Arcade: the comeback system must reward consistency and recognize recovery gaps deterministically. */

import { describe, expect, it } from "vitest";
import { daysBetween, levelForXp } from "./db";

describe("comeback calculations", () => {
  it("uses calendar dates to distinguish a continuing system from a recovery gap", () => {
    expect(daysBetween("2026-08-12", "2026-08-13")).toBe(1);
    expect(daysBetween("2026-08-10", "2026-08-13")).toBe(3);
  });

  it("starts every learner at level one and increases levels as comeback XP compounds", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(900)).toBe(4);
  });
});
