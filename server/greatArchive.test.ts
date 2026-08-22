import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("The Great Archive collection strategy mode", () => {
  it("collects exact approved-question topics, preserves correction, and avoids timer, paid, or CBT-history loops", () => {
    const component = readFileSync("client/src/components/GreatArchive.tsx", "utf8");
    const arcade = readFileSync("client/src/components/GameArcade.tsx", "utf8");
    expect(component).toContain("questions.filter((question) => question.subject === subject)");
    expect(component).toContain("session.find((question) => question.id === answer.questionId)?.topic");
    expect(component).toContain("writeArcadeProfile({ ...profile, greatArchive: next })");
    expect(component).toContain("onOpenCorrection(subject, misses)");
    expect(component).toContain("Correct answer:");
    expect(component).not.toContain("CBT");
    expect(component).not.toContain("payment");
    expect(component).not.toContain("timer");
    expect(arcade).toContain('onSelect("archive")');
  });
});
