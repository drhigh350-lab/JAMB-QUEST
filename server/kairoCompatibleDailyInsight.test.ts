import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("KAIRO-compatible daily insight boundary", () => {
  it("keeps JAMB Quest's daily report as one evidence-only reflection and one next action, without adding a new crowded intelligence screen", () => {
    const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");

    expect(home).toContain('data-testid="daily-report-sheet"');
    expect(home).toContain("RECORDED TODAY");
    expect(home).toContain("const dailyReflection");
    expect(home).toContain('className="daily-report-reflection"');
    expect(home).toContain("Next suggested move");
    expect(home).toContain("This sheet uses today’s saved questions, correct answers, goal progress, and XP only.");
    expect(home).not.toContain("KAIRO");
  });
});
