import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CBT readiness and daily completion", () => {
  it("states the practical CBT safeguards before launch", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain('aria-label="CBT readiness checklist"');
    expect(home).toContain("Answers, flags, and position save as you go");
    expect(home).toContain("Accidental exit asks before ending your CBT");
  });

  it("shows a completion summary only from recorded daily evidence", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("data-testid=\"daily-completion-summary\"");
    expect(home).toContain("selectedState.today.correctCount}/{selectedState.today.questionsAnswered} correct");
    expect(home).toContain("progressNextAction");
    expect(home).toContain("Start next repair");
  });
});
