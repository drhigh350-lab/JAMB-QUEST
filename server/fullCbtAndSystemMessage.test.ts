import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveCbtDurationSeconds } from "../client/src/game/useQuizGame";
import { STANDARD_FULL_CBT_SECONDS } from "../client/src/game/types";

describe("visible standard CBT and system-first positioning", () => {
  it("sets the 180-question standard CBT to exactly two hours while retaining normal shorter CBT timing", () => {
    expect(STANDARD_FULL_CBT_SECONDS).toBe(7_200);
    expect(resolveCbtDurationSeconds({ subject: "Full JAMB Mock", mode: "cbt", count: 180 })).toBe(7_200);
    expect(resolveCbtDurationSeconds({ subject: "Biology", mode: "cbt", count: 20 })).toBe(1_500);
  });

  it("keeps the full CBT first in Practice, restores a compact optional Lekki route, and centers About on systems", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain('data-testid="standard-cbt-path"');
    expect(home).toContain("Standard CBT");
    expect(home).toContain("180 questions · 2 hours");
    expect(home).toContain("Confirm your JAMB simulation");
    expect(home).toContain("60 ENG / 40 BIO / 40 CHE / 40 PHY");
    expect(home).toContain("CBT safely saved");
    expect(home).toContain("last saved at question");
    expect(home).not.toContain("Add The Lekki Headmaster?");
    expect(home).not.toContain('data-testid="lekki-palette"');
    expect(home).toContain('<details className="practice-subject-path">');
    expect(home).toContain('data-testid="lekki-practice-path"');
    expect(home).toContain('data-testid="lekki-mixed-study-start"');
    expect(home).toContain('includeLekki: true');
    expect(home).toContain("Goals point.");
    expect(home).toContain("Systems carry.");
    expect(home).toContain("Winners and losers can share the same goal");
  });
});
