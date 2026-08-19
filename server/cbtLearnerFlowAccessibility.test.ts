import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CBT learner-flow labels and safety wording", () => {
  it("keeps the Standard CBT preflight and saved-session controls explicit", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("STANDARD CBT / READY CHECK");
    expect(home).toContain("Confirm your JAMB simulation");
    expect(home).toContain("Not yet");
    expect(home).toContain("Start 2-hour CBT");
    expect(home).toContain("CBT safely saved");
    expect(home).toContain("last saved at question");
  });

  it("keeps report and correction actions labelled as private and optional", () => {
    const card = readFileSync(resolve(process.cwd(), "client/src/components/QuestionCard.tsx"), "utf8");
    const review = readFileSync(resolve(process.cwd(), "client/src/components/ExamReview.tsx"), "utf8");
    expect(card).toContain("QUALITY REPORT / PRIVATE");
    expect(card).toContain("Issue type");
    expect(card).toContain("Optional note");
    expect(card).toContain("does not change this question or show to other learners");
    expect(review).toContain("Why did you miss it?");
    expect(review).toContain("Optional, but it sharpens your repair plan.");
  });

  it("keeps the CBT exit guard clear about saved answers and time", () => {
    const shell = readFileSync(resolve(process.cwd(), "client/src/components/QuizShell.tsx"), "utf8");
    expect(shell).toContain("Leave this CBT?");
    expect(shell).toContain("Your answers, flags, question position, and remaining time are already saved");
    expect(shell).toContain("Save and exit");
  });
});
